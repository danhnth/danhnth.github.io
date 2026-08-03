import { inflateSync } from 'node:zlib';

/**
 * Minimal PNG decoder (8-bit RGBA/RGB/gray only) + pixel diff helper.
 * Used to compare two screenshots pixel-by-pixel so the CRT scroll
 * regression tests don't rely on byte-level screenshot equality.
 */
export interface DecodedImage {
  width: number;
  height: number;
  pixels: Buffer;
}

export function decodePNG(buf: Buffer): DecodedImage {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a png');
  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + len;
  }
  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(width * height * 4);
  const paeth = (a: number, b: number, c: number): number => {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const prev = y > 0 ? pixels.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      let v = line[x];
      const a = x >= channels ? line[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = x >= channels && prev ? prev[x - channels] : 0;
      if (filter === 1) v = (v + a) & 255;
      else if (filter === 2) v = (v + b) & 255;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 255;
      else if (filter === 4) v = (v + paeth(a, b, c)) & 255;
      pixels[y * width * 4 + x] = v;
    }
  }
  return { width, height, pixels };
}

/**
 * Ratio of pixels whose summed RGB delta exceeds `threshold`.
 * Ignores alpha.
 */
export function diffRatio(a: DecodedImage, b: DecodedImage, threshold = 36): number {
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  let changed = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ia = y * a.width * 4 + x * 4;
      const ib = y * b.width * 4 + x * 4;
      const d =
        Math.abs(a.pixels[ia] - b.pixels[ib]) +
        Math.abs(a.pixels[ia + 1] - b.pixels[ib + 1]) +
        Math.abs(a.pixels[ia + 2] - b.pixels[ib + 2]);
      if (d > threshold) changed++;
    }
  }
  return changed / (w * h);
}