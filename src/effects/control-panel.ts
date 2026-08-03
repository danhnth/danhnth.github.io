import type { CRTConfig } from '../types/effects.ts';

type NumericKey = {
  [K in keyof CRTConfig]: CRTConfig[K] extends number ? K : never;
}[keyof CRTConfig];

interface SliderSpec {
  key: NumericKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface SliderGroup {
  title: string;
  sliders: SliderSpec[];
}

const GROUPS: SliderGroup[] = [
  {
    title: 'Beam',
    sliders: [
      { key: 'hardScan', label: 'Scanline hardness', min: -24, max: -1, step: 0.5 },
      { key: 'hardPix', label: 'Pixel hardness', min: -6, max: -0.5, step: 0.1 },
      { key: 'beamMinWidth', label: 'Beam width (black)', min: 0.5, max: 4, step: 0.05 },
      { key: 'beamMaxWidth', label: 'Beam width (white)', min: 0.5, max: 8, step: 0.05 },
      { key: 'beamPower', label: 'Beam bloom curve', min: 0.5, max: 8, step: 0.1 },
      { key: 'scanlineIntensity', label: 'Scanline depth', min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    title: 'Aperture grille',
    sliders: [
      { key: 'phosphorMaskIntensity', label: 'Mask strength', min: 0, max: 1, step: 0.01 },
      { key: 'maskPitch', label: 'Mask pitch (px)', min: 1, max: 12, step: 1 },
      { key: 'maskDark', label: 'Mask dark', min: 0.15, max: 1, step: 0.01 },
      { key: 'maskLight', label: 'Mask light', min: 0.6, max: 2, step: 0.01 },
    ],
  },
  {
    title: 'Glow',
    sliders: [
      { key: 'bloomStrength', label: 'Bloom amount', min: 0, max: 3, step: 0.01 },
      { key: 'bloomThreshold', label: 'Bloom threshold', min: 0, max: 1, step: 0.01 },
      { key: 'bloomKnee', label: 'Bloom knee', min: 0.01, max: 0.5, step: 0.01 },
      { key: 'burnInStrength', label: 'Phosphor persistence', min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    title: 'Geometry',
    sliders: [
      { key: 'curvatureAmount', label: 'Curvature', min: 0, max: 0.3, step: 0.005 },
      { key: 'cornerPinch', label: 'Corner pinch', min: 0, max: 0.3, step: 0.005 },
      { key: 'vignetteStrength', label: 'Vignette', min: 0, max: 1.5, step: 0.01 },
    ],
  },
  {
    title: 'Signal',
    sliders: [
      { key: 'brightness', label: 'Brightness', min: 0.6, max: 2.5, step: 0.01 },
      { key: 'noiseIntensity', label: 'Noise', min: 0, max: 0.3, step: 0.005 },
      { key: 'flickerRate', label: 'Flicker', min: 0, max: 0.3, step: 0.005 },
      { key: 'jitterIntensity', label: 'Jitter', min: 0, max: 0.02, step: 0.0005 },
    ],
  },
  {
    title: 'Gamma',
    sliders: [
      { key: 'crtGamma', label: 'CRT gamma', min: 1.8, max: 3.2, step: 0.05 },
      { key: 'monitorGamma', label: 'Monitor gamma', min: 1.8, max: 3.2, step: 0.05 },
    ],
  },
];

const STORAGE_KEY = 'crt-shader-tuning';
const TOGGLE_KEY = 'F9';
const RESET_QUERY = 'resetcrt';

/**
 * Live tuning panel for the CRT shader.
 *
 * Toggle with F9. Values persist to localStorage and are re-applied on load,
 * so a tuning session survives a page reload. "Copy config" emits a TypeScript
 * snippet suitable for pasting into the tier configs in utils/gpu-detect.ts.
 */
export class ShaderControlPanel {
  private root: HTMLDivElement;
  private config: CRTConfig;
  private readonly defaults: CRTConfig;
  private onChange: (config: CRTConfig) => void;
  private keydownHandler: (event: KeyboardEvent) => void;
  private valueLabels = new Map<NumericKey, HTMLSpanElement>();
  private inputs = new Map<NumericKey, HTMLInputElement>();
  private visible = false;

  constructor(config: CRTConfig, onChange: (config: CRTConfig) => void) {
    this.defaults = { ...config };

    // Escape hatch: ?resetcrt in the URL discards a saved tuning session.
    if (new URLSearchParams(window.location.search).has(RESET_QUERY)) {
      this.clearStored();
    }

    this.config = { ...config, ...this.loadStored() };
    this.onChange = onChange;

    this.root = document.createElement('div');
    this.root.className = 'crt-tuner';
    this.root.setAttribute('aria-hidden', 'true');
    this.build();
    document.body.appendChild(this.root);

    this.keydownHandler = (event: KeyboardEvent): void => {
      if (event.key === TOGGLE_KEY) {
        event.preventDefault();
        this.toggle();
      }
    };
    document.addEventListener('keydown', this.keydownHandler);

    if (this.hasStoredOverrides()) {
      this.onChange(this.getConfig());
    }
  }

  /**
   * Config as applied to the pipeline.
   *
   * Guarded against a fully black screen: a tuning session persists to
   * localStorage, so a combination that renders nothing would survive reloads
   * and look exactly like "the shader is broken" with no way back.
   */
  getConfig(): CRTConfig {
    const c = { ...this.config };
    const visible = c.brightness * c.sourceOpacity * Math.max(c.maskLight, c.maskDark);
    if (!Number.isFinite(visible) || visible < 0.05) {
      c.brightness = this.defaults.brightness;
      c.sourceOpacity = this.defaults.sourceOpacity;
      c.maskLight = this.defaults.maskLight;
      c.maskDark = this.defaults.maskDark;
    }
    return c;
  }

  toggle(): void {
    this.visible = !this.visible;
    this.root.classList.toggle('crt-tuner--open', this.visible);
    this.root.setAttribute('aria-hidden', this.visible ? 'false' : 'true');
  }

  destroy(): void {
    document.removeEventListener('keydown', this.keydownHandler);
    this.root.remove();
  }

  private build(): void {
    const header = document.createElement('div');
    header.className = 'crt-tuner__header';
    header.textContent = 'CRT TUNING — F9';
    this.root.appendChild(header);

    const body = document.createElement('div');
    body.className = 'crt-tuner__body';
    this.root.appendChild(body);

    for (const group of GROUPS) {
      const title = document.createElement('div');
      title.className = 'crt-tuner__group';
      title.textContent = group.title;
      body.appendChild(title);

      for (const spec of group.sliders) {
        body.appendChild(this.buildSlider(spec));
      }
    }

    this.root.appendChild(this.buildActions());
  }

  private buildSlider(spec: SliderSpec): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'crt-tuner__row';

    const label = document.createElement('label');
    label.className = 'crt-tuner__label';
    label.textContent = spec.label;
    label.htmlFor = `crt-tuner-${spec.key}`;

    const value = document.createElement('span');
    value.className = 'crt-tuner__value';
    value.textContent = this.format(this.config[spec.key]);

    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'crt-tuner__slider';
    input.id = `crt-tuner-${spec.key}`;
    input.min = String(spec.min);
    input.max = String(spec.max);
    input.step = String(spec.step);
    input.value = String(this.config[spec.key]);

    input.addEventListener('input', () => {
      const parsed = Number.parseFloat(input.value);
      if (!Number.isFinite(parsed)) return;
      this.config = { ...this.config, [spec.key]: parsed };
      value.textContent = this.format(parsed);
      this.persist();
      this.onChange(this.getConfig());
    });

    this.valueLabels.set(spec.key, value);
    this.inputs.set(spec.key, input);

    row.appendChild(label);
    row.appendChild(value);
    row.appendChild(input);
    return row;
  }

  private buildActions(): HTMLDivElement {
    const actions = document.createElement('div');
    actions.className = 'crt-tuner__actions';

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'crt-tuner__button';
    reset.textContent = 'Reset';
    reset.addEventListener('click', () => this.reset());

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'crt-tuner__button';
    copy.textContent = 'Copy config';
    copy.addEventListener('click', () => {
      const snippet = this.toSnippet();
      void navigator.clipboard?.writeText(snippet).then(
        () => {
          copy.textContent = 'Copied';
          setTimeout(() => {
            copy.textContent = 'Copy config';
          }, 1200);
        },
        () => {
          copy.textContent = 'See console';
          console.log(snippet);
          setTimeout(() => {
            copy.textContent = 'Copy config';
          }, 1600);
        }
      );
    });

    actions.appendChild(reset);
    actions.appendChild(copy);
    return actions;
  }

  private reset(): void {
    this.config = { ...this.defaults };
    for (const [key, input] of this.inputs) {
      input.value = String(this.config[key]);
      const label = this.valueLabels.get(key);
      if (label) {
        label.textContent = this.format(this.config[key]);
      }
    }
    this.clearStored();
    this.onChange(this.getConfig());
  }

  private clearStored(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  private toSnippet(): string {
    const keys = GROUPS.flatMap((group) => group.sliders.map((slider) => slider.key));
    const lines = keys.map((key) => `  ${key}: ${this.config[key]},`);
    return `{\n${lines.join('\n')}\n}`;
  }

  private format(value: number): string {
    if (Number.isInteger(value)) return value.toFixed(1);
    return String(Math.round(value * 10000) / 10000);
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.collectOverrides()));
    } catch {
      // Ignore storage errors
    }
  }

  private collectOverrides(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const group of GROUPS) {
      for (const spec of group.sliders) {
        out[spec.key] = this.config[spec.key];
      }
    }
    return out;
  }

  private hasStoredOverrides(): boolean {
    return Object.keys(this.loadStored()).length > 0;
  }

  private loadStored(): Partial<CRTConfig> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) return {};

      // Persisted values are untrusted input: clamp to live slider ranges.
      const specs = new Map<string, SliderSpec>(
        GROUPS.flatMap((group) => group.sliders.map((s) => [String(s.key), s] as const))
      );
      const out: Record<string, number> = {};
      for (const [key, value] of Object.entries(parsed)) {
        const spec = specs.get(key);
        if (!spec || typeof value !== 'number' || !Number.isFinite(value)) continue;
        out[key] = Math.min(spec.max, Math.max(spec.min, value));
      }
      return out as Partial<CRTConfig>;
    } catch {
      return {};
    }
  }
}
