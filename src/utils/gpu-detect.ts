import type { GPUTier, CRTConfig, GPUInfo } from '../types/effects';

/**
 * Renderer strings that indicate software (CPU) rasterization.
 * Software WebGL cannot sustain a fullscreen multi-pass CRT shader.
 */
const SOFTWARE_RENDERERS = [
  'swiftshader',
  'llvmpipe',
  'software adapter',
  'microsoft basic render',
  'softpipe',
];

export type CapabilityCheck = { ok: true } | { ok: false; reason: string };

/**
 * Checks whether the device can run the WebGL CRT pipeline via real
 * capability queries. Deliberately contains NO timing benchmarks (shader
 * compilation is async over the GPU command buffer in Chromium — timing it
 * measures IPC noise plus one-time ANGLE/D3D warmup, not GPU throughput)
 * and NO device-class heuristics. Hard disqualifiers only; an unknown
 * renderer string means "unknown, assume capable".
 */
export function checkWebGLCapability(): CapabilityCheck {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', {
    alpha: false,
    premultipliedAlpha: false,
    antialias: false,
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: false,
  }) as WebGLRenderingContext | null;

  if (!gl) return { ok: false, reason: 'no-webgl-context' };

  try {
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    // Absent string => UNKNOWN, not a failure. Never demote on missing info.
    const renderer = dbg
      ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? '').toLowerCase()
      : '';
    if (renderer && SOFTWARE_RENDERERS.some((s) => renderer.includes(s))) {
      return { ok: false, reason: `software-renderer:${renderer}` };
    }

    if (gl.getParameter(gl.MAX_TEXTURE_SIZE) < 2048) {
      return { ok: false, reason: 'max-texture-size' };
    }
    if (gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) < 64) {
      return { ok: false, reason: 'frag-uniform-vectors' };
    }
    // Main fragment shader samples 4 textures: source, noise, bloom, burn-in.
    if (gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) < 4) {
      return { ok: false, reason: 'texture-units' };
    }
    // shader-source.ts declares `precision highp float;` — optional in
    // fragment shaders per the WebGL spec, so verify support.
    const highp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    if (!highp || highp.precision === 0) {
      return { ok: false, reason: 'no-highp-fragment' };
    }

    return { ok: true };
  } finally {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

/**
 * Selects the quality preset. This no longer gates whether WebGL runs —
 * the CRT manager attempts the pipeline optimistically and demotes on real
 * failure (init failure, context loss, sustained low FPS).
 *
 * NOTE: prefers-reduced-motion is intentionally NOT consulted here. It is an
 * accessibility signal about motion, not capability — the WebGL pipeline
 * still runs with motion parameters zeroed (see applyReducedMotion).
 */
export function detectGPUTier(): GPUTier {
  return checkWebGLCapability().ok ? 'high' : 'low';
}

/**
 * Returns GPU info including renderer string, vendor, and detected tier.
 */
export function getGPUInfo(): GPUInfo {
  if (typeof window === 'undefined') {
    return { renderer: '', vendor: '', tier: 'minimal' };
  }

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
  if (!gl) {
    return { renderer: '', vendor: '', tier: 'low' };
  }

  try {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      return { renderer: '', vendor: '', tier: 'low' };
    }

    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';

    return { renderer, vendor, tier: 'high' };
  } finally {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

/**
 * Zeroes every animated shader parameter while preserving the static CRT
 * look (scanlines, curvature, vignette, phosphor mask, bloom). This is how
 * prefers-reduced-motion is honored WITHOUT disabling the WebGL pipeline:
 * static rendering is not motion.
 */
export function applyReducedMotion(config: CRTConfig): CRTConfig {
  return {
    ...config,
    flickerRate: 0,
    jitterIntensity: 0,
    noiseIntensity: 0,
    burnInStrength: 0,
  };
}

/**
 * Returns optimized CRT config based on GPU tier.
 * Respects prefers-contrast: more (disables bloom/glow).
 */
export function getCRTConfig(tier: GPUTier): CRTConfig {
  const prefersHighContrast = window.matchMedia(
    '(prefers-contrast: more)'
  ).matches;

  const configs: Record<GPUTier, CRTConfig> = {
    high: {
      tier: 'high',
      scanlineIntensity: 0.5,
      bloomStrength: 1.4,
      curvatureAmount: 0.05,
      flickerRate: 0.22,
      noiseIntensity: 0.01,
      vignetteStrength: 0.7,
      brightness: 1.3,
      jitterIntensity: 0.0015,
      phosphorMaskIntensity: 1.0,
      cornerPinch: 0.01,
      burnInStrength: 0.0,
      sourceOpacity: 1.0,
      hardScan: -10.0,
      hardPix: -3.0,
      beamMinWidth: 1.4,
      beamMaxWidth: 3.2,
      beamPower: 3.0,
      maskPitch: 3.0,
      maskDark: 0.6,
      maskLight: 1.25,
      bloomThreshold: 0.55,
      bloomKnee: 0.12,
      crtGamma: 2.4,
      monitorGamma: 2.2,
    },
    low: {
      tier: 'low',
      scanlineIntensity: 0.25,
      bloomStrength: 0.7,
      curvatureAmount: 0.04,
      flickerRate: 0.05,
      noiseIntensity: 0.06,
      vignetteStrength: 0.35,
      brightness: 1.15,
      jitterIntensity: 0.0025,
      phosphorMaskIntensity: 0.5,
      cornerPinch: 0.03,
      burnInStrength: 0.12,
      sourceOpacity: 1.0,
      hardScan: -8.0,
      hardPix: -2.0,
      beamMinWidth: 1.6,
      beamMaxWidth: 2.8,
      beamPower: 3.0,
      maskPitch: 3.0,
      maskDark: 0.75,
      maskLight: 1.15,
      bloomThreshold: 0.6,
      bloomKnee: 0.12,
      crtGamma: 2.4,
      monitorGamma: 2.2,
    },
    minimal: {
      tier: 'minimal',
      scanlineIntensity: 0.08,
      bloomStrength: 0.0,
      curvatureAmount: 0.0,
      flickerRate: 0.0,
      noiseIntensity: 0.0,
      vignetteStrength: 0.2,
      brightness: 1.0,
      jitterIntensity: 0.0,
      phosphorMaskIntensity: 0.0,
      cornerPinch: 0.0,
      burnInStrength: 0.0,
      sourceOpacity: 1.0,
      hardScan: -8.0,
      hardPix: -2.0,
      beamMinWidth: 2.0,
      beamMaxWidth: 2.0,
      beamPower: 3.0,
      maskPitch: 3.0,
      maskDark: 1.0,
      maskLight: 1.0,
      bloomThreshold: 1.0,
      bloomKnee: 0.1,
      crtGamma: 2.2,
      monitorGamma: 2.2,
    },
  };

  const config = configs[tier];

  // Disable bloom/glow if prefers-contrast: more
  if (prefersHighContrast) {
    return { ...config, bloomStrength: 0 };
  }

  return config;
}

export type { GPUTier, CRTConfig, GPUInfo };
