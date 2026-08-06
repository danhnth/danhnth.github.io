/**
 * TerminalTextureSource paints the terminal's CURRENT visible viewport onto a
 * canvas that the WebGL CRT overlay samples as its source texture.
 *
 * The previous implementation used html-to-image's toCanvas(): a full DOM
 * clone + SVG foreignObject rasterization per capture. That approach was
 * (1) expensive on the main thread — every DOM mutation while typing or
 * streaming output triggered a capture, and (2) structurally scroll-blind:
 * cloneNode does not copy scrollTop and html-to-image sizes the capture from
 * clientWidth/clientHeight, so the texture always showed the output buffer at
 * scrollTop 0 while the visible DOM scrolled underneath. The overlay therefore
 * never moved when the user scrolled ("can't scroll") and never showed new
 * bottom content ("screen broken in half").
 *
 * This renderer draws the visible DOM fragments directly with canvas 2D at
 * their getBoundingClientRect positions, which already account for scroll.
 * Cost scales with the number of visible nodes (a few ms), not the whole
 * terminal DOM.
 */
export class TerminalTextureSource {
  private terminalElement: HTMLElement;
  private lastCanvas: HTMLCanvasElement | null = null;

  constructor(terminalElement: HTMLElement) {
    this.terminalElement = terminalElement;
  }

  /**
   * Render the current visible viewport to a canvas.
   * @returns The captured canvas, or the last one if rendering failed
   */
  async capture(): Promise<HTMLCanvasElement | null> {
    this.lastCanvas = this.renderViewport();
    return this.lastCanvas;
  }

  /**
   * Returns the last captured canvas, or null if no capture has been made yet.
   */
  getLastCanvas(): HTMLCanvasElement | null {
    return this.lastCanvas;
  }

  private renderViewport(): HTMLCanvasElement | null {
    const term = this.terminalElement;
    const termRect = term.getBoundingClientRect();
    if (termRect.width < 2 || termRect.height < 2) return this.lastCanvas;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(termRect.width);
    canvas.height = Math.round(termRect.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const termStyle = getComputedStyle(term);
    const borderLeft = parseFloat(termStyle.borderLeftWidth) || 0;
    const borderTop = parseFloat(termStyle.borderTopWidth) || 0;
    const borderRight = parseFloat(termStyle.borderRightWidth) || 0;
    const borderBottom = parseFloat(termStyle.borderBottomWidth) || 0;

    // Monitor bezel ring, then the screen area behind the content.
    ctx.fillStyle = termStyle.borderTopColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const screen = {
      left: borderLeft,
      top: borderTop,
      right: canvas.width - borderRight,
      bottom: canvas.height - borderBottom,
    };
    ctx.fillStyle = termStyle.backgroundColor;
    ctx.fillRect(screen.left, screen.top, screen.right - screen.left, screen.bottom - screen.top);

    ctx.save();
    ctx.beginPath();
    ctx.rect(screen.left, screen.top, screen.right - screen.left, screen.bottom - screen.top);
    ctx.clip();

    const output = term.querySelector<HTMLElement>('.crt-terminal__output');
    const inputLine = term.querySelector<HTMLElement>('.crt-terminal__input-line');

    if (output) this.paintSubtree(ctx, output, termRect, screen);
    if (inputLine) this.paintSubtree(ctx, inputLine, termRect, screen);

    ctx.restore();
    return canvas;
  }

  /**
   * Paint one content subtree: element backgrounds, images, then text nodes.
   * Only fragments intersecting the visible screen box are drawn.
   */
  private paintSubtree(
    ctx: CanvasRenderingContext2D,
    root: HTMLElement,
    termRect: DOMRect,
    screen: ScreenBox
  ): void {
    if (!this.intersects(root.getBoundingClientRect(), termRect)) return;

    this.paintBackgrounds(ctx, root, termRect, screen);
    this.paintImages(ctx, root, termRect, screen);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      this.paintTextNode(ctx, node as Text, termRect, screen);
    }
  }

  private paintBackgrounds(
    ctx: CanvasRenderingContext2D,
    root: HTMLElement,
    termRect: DOMRect,
    screen: ScreenBox
  ): void {
    this.visibleBackground(ctx, root, termRect, screen);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    for (let el = walker.nextNode() as Element | null; el; el = walker.nextNode() as Element | null) {
      this.visibleBackground(ctx, el as HTMLElement, termRect, screen);
    }
  }

  /** Fill the element's box if it has a visible background. */
  private visibleBackground(
    ctx: CanvasRenderingContext2D,
    el: HTMLElement,
    termRect: DOMRect,
    screen: ScreenBox
  ): boolean {
    const rect = el.getBoundingClientRect();
    if (!this.intersects(rect, termRect)) return false;
    const style = getComputedStyle(el);
    const alpha = this.alphaOf(style.backgroundColor);
    if (alpha <= 0) return false;
    ctx.globalAlpha = Math.min(alpha, parseFloat(style.opacity) || 1);
    ctx.fillStyle = style.backgroundColor;
    ctx.fillRect(
      Math.max(rect.left, screen.left) - termRect.left,
      Math.max(rect.top, screen.top) - termRect.top,
      Math.min(rect.right, screen.right) - Math.max(rect.left, screen.left),
      Math.min(rect.bottom, screen.bottom) - Math.max(rect.top, screen.top)
    );
    ctx.globalAlpha = 1;
    return true;
  }

  private paintImages(
    ctx: CanvasRenderingContext2D,
    root: HTMLElement,
    termRect: DOMRect,
    screen: ScreenBox
  ): void {
    for (const img of Array.from(root.querySelectorAll('img'))) {
      if (!img.naturalWidth || !img.naturalHeight) continue;
      const rect = img.getBoundingClientRect();
      if (!this.intersects(rect, termRect)) continue;
      ctx.drawImage(
        img,
        Math.max(rect.left, screen.left) - termRect.left,
        Math.max(rect.top, screen.top) - termRect.top,
        Math.min(rect.right, screen.right) - Math.max(rect.left, screen.left),
        Math.min(rect.bottom, screen.bottom) - Math.max(rect.top, screen.top)
      );
    }
  }

  private paintTextNode(
    ctx: CanvasRenderingContext2D,
    node: Text,
    termRect: DOMRect,
    screen: ScreenBox
  ): void {
    const parent = node.parentElement;
    const text = node.data;
    if (!parent || !text.trim()) return;

    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = Array.from(range.getClientRects()).filter((r) =>
      this.intersectsRect(r, termRect, screen)
    );
    if (rects.length === 0) return;

    const style = getComputedStyle(parent);
    // style.font serializes to "" when font-kerning / font-variant-ligatures
    // are set (Chromium quirk — this terminal sets both). Assigning "" to
    // ctx.font is ignored, leaving the default 10px sans-serif and text ~40%
    // narrower than the DOM, which detaches the cursor block from the prompt.
    ctx.font =
      `${style.fontStyle} ${style.fontWeight} ${style.fontSize}/${style.lineHeight} ${style.fontFamily}`;
    ctx.fillStyle = style.color;
    const metrics = ctx.measureText('M');
    const ascent = metrics.fontBoundingBoxAscent || rects[0].height * 0.8;

    let consumed = 0;
    for (const rect of rects) {
      const remaining = text.slice(consumed);
      if (consumed >= text.length) break;
      const fits =
        rects.length === 1 || ctx.measureText(remaining).width <= rect.width + 2;
      const chunk = fits ? remaining : this.longestFit(ctx, remaining, rect.width);
      this.drawText(ctx, chunk, rect, termRect, ascent);
      consumed += chunk.length;
    }
  }

  /** Longest prefix of `text` whose rendered width fits within `maxWidth`. */
  private longestFit(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string {
    let lo = 1;
    let hi = text.length;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (ctx.measureText(text.slice(0, mid)).width <= maxWidth + 2) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return text.slice(0, lo);
  }

  private drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    rect: DOMRect,
    termRect: DOMRect,
    ascent: number
  ): void {
    if (!text) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.left - termRect.left, rect.top - termRect.top, rect.width, rect.height);
    ctx.clip();
    ctx.fillText(text, rect.left - termRect.left, rect.top - termRect.top + ascent);
    ctx.restore();
  }

  private alphaOf(color: string): number {
    const match = /rgba?\(([^)]+)\)/.exec(color);
    if (!match) return 1;
    const parts = match[1].split(',').map((p) => parseFloat(p.trim()));
    return parts.length >= 4 ? parts[3] : 1;
  }

  private intersects(rect: DOMRect, termRect: DOMRect): boolean {
    return this.intersectsRect(rect, termRect, undefined);
  }

  private intersectsRect(rect: DOMRect, termRect: DOMRect, screen?: ScreenBox): boolean {
    if (rect.width <= 0 || rect.height <= 0) return false;
    if (rect.bottom < termRect.top || rect.top > termRect.bottom) return false;
    if (rect.right < termRect.left || rect.left > termRect.right) return false;
    if (screen) {
      if (rect.bottom < screen.top || rect.top > screen.bottom) return false;
      if (rect.right < screen.left || rect.left > screen.right) return false;
    }
    return true;
  }
}

interface ScreenBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
