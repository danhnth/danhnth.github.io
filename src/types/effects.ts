export type GPUTier = 'high' | 'low' | 'minimal';

export interface CRTConfig {
  tier: GPUTier;
  scanlineIntensity: number;
  bloomStrength: number;
  curvatureAmount: number;
  flickerRate: number;
  noiseIntensity: number;
  beamIntensity: number;
  vignetteStrength: number;
  hSyncIntensity: number;
  rgbShift: number;
  brightness: number;
  jitterIntensity: number;
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