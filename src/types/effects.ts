export type GPUTier = 'high' | 'low' | 'minimal';

export interface CRTConfig {
  tier: GPUTier;
  scanlineIntensity: number;
  bloomStrength: number;
  curvatureAmount: number;
  flickerRate: number;
  noiseIntensity: number;
  vignetteStrength: number;
  brightness: number;
  jitterIntensity: number;
  phosphorMaskIntensity: number;
  cornerPinch: number;
  burnInStrength: number;
  sourceOpacity: number;

  /** Scanline sharpness. More negative = tighter beam (Lottes hardScan). */
  hardScan: number;
  /** Horizontal filter sharpness (Lottes hardPix). */
  hardPix: number;
  /** Beam width at black, in scanlines. */
  beamMinWidth: number;
  /** Beam width at full white — the beam-blooming range. */
  beamMaxWidth: number;
  /** Exponent mapping luminance to beam width. */
  beamPower: number;
  /** Aperture-grille cell width in physical pixels. */
  maskPitch: number;
  /** Brightness of unlit mask subpixels. */
  maskDark: number;
  /** Brightness of lit mask subpixels. */
  maskLight: number;
  /** Luminance below which nothing blooms. */
  bloomThreshold: number;
  /** Soft-knee width of the bloom threshold. */
  bloomKnee: number;
  /** Simulated CRT phosphor gamma. */
  crtGamma: number;
  /** Physical display gamma. */
  monitorGamma: number;
}

export interface ShaderProgram {
  vertexSource: string;
  fragmentSource: string;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

export interface GPUInfo {
  renderer: string;
  vendor: string;
  tier: GPUTier;
}