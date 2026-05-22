import type { GPUTier, CRTConfig, GPUInfo } from '../types/effects';

// Low-end GPU blacklist - 15-20% of mobile GPUs cannot run CRT shaders
const LOW_END_GPU_BLACKLIST = [
  'Adreno 610',
  'PowerVR GE8320',
  'Mali-G52 MC2',
  'Intel HD 4000',
];

/**
 * Detects GPU capability and returns appropriate tier.
 * Must respect prefers-reduced-motion and prefers-contrast media queries.
 * Safari WebGL has 25× performance delta on first-draw shader compilation.
 */
export function detectGPUTier(): GPUTier {
  // Respect prefers-reduced-motion: force minimal tier
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'minimal';
  }

  // Mobile detection: cap at 'low'
  const isMobile =
    navigator.maxTouchPoints > 0 && window.innerWidth < 768;
  if (isMobile) {
    // Check if GPU is in blacklist - downgrade to minimal
    const gpuInfo = getGPUInfo();
    if (isBlacklistedGPU(gpuInfo.renderer)) {
      return 'minimal';
    }
    return 'low';
  }

  // Desktop: run WebGL benchmark
  try {
    const gl = getWebGLContext();
    if (!gl) {
      return 'low';
    }

    const gpuInfo = getGPUInfo();
    if (isBlacklistedGPU(gpuInfo.renderer)) {
      return 'low';
    }

    // Run shader compile benchmark
    const benchmarkTime = runShaderBenchmark(gl);
    gl.getExtension('WEBGL_lose_context')?.loseContext();

    // Threshold: > 50ms = low tier, > 100ms = minimal tier
    if (benchmarkTime > 100) {
      return 'minimal';
    }
    if (benchmarkTime > 50) {
      return 'low';
    }
    return 'high';
  } catch {
    return 'low';
  }
}

/**
 * Gets WebGL context from temporary canvas.
 */
function getWebGLContext(): WebGLRenderingContext | null {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  return gl as WebGLRenderingContext | null;
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

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (!debugInfo) {
    return { renderer: '', vendor: '', tier: 'low' };
  }

  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
  const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';

  return { renderer, vendor, tier: 'high' };
}

/**
 * Checks if GPU is in the low-end blacklist.
 */
function isBlacklistedGPU(renderer: string): boolean {
  return LOW_END_GPU_BLACKLIST.some((gpu) =>
    renderer.toLowerCase().includes(gpu.toLowerCase())
  );
}

/**
 * Runs a brief shader compile benchmark (single triangle, measure time).
 * Must not block main thread for more than 100ms.
 */
function runShaderBenchmark(gl: WebGLRenderingContext): number {
  const vertexSource = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision mediump float;
    void main() {
      gl_FragColor = vec4(0.5, 0.8, 0.2, 1.0);
    }
  `;

  const startTime = performance.now();

  // Compile vertex shader
  const vs = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vs, vertexSource);
  gl.compileShader(vs);

  // Compile fragment shader
  const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fs, fragmentSource);
  gl.compileShader(fs);

  // Link program
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.useProgram(program);

  const endTime = performance.now();

  // Cleanup
  gl.deleteProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  return endTime - startTime;
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
      scanlineIntensity: 0.15,
      bloomStrength: 1.0,
      curvatureAmount: 0.02,
      flickerRate: 0.03,
    },
    low: {
      tier: 'low',
      scanlineIntensity: 0.08,
      bloomStrength: 0.0,
      curvatureAmount: 0.0,
      flickerRate: 0.0,
    },
    minimal: {
      tier: 'minimal',
      scanlineIntensity: 0.0,
      bloomStrength: 0.0,
      curvatureAmount: 0.0,
      flickerRate: 0.0,
    },
  };

  const config = configs[tier];

  // Disable bloom/glow if prefers-contrast: more
  if (prefersHighContrast) {
    return { ...config, bloomStrength: 0 };
  }

  return config;
}

/**
 * Warms up CRT shaders offscreen on 1×1 canvas.
 * Compiles shaders during BIOS POST phase to avoid Safari stall.
 * Safari has 25× performance delta on first-draw shader compilation.
 */
export function warmupShaders(): void {
  if (typeof window === 'undefined') return;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;
    if (!gl) return;

    // Minimal shader for warmup - just enough to trigger compilation
    const vertexSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragmentSource = `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      }
    `;

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vertexSource);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fragmentSource);
    gl.compileShader(fs);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    // Force GPU to process by drawing
    gl.useProgram(program);

    // Cleanup
    gl.deleteProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    // Lose context to free memory
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    // Silently fail - warmup is best-effort
  }
}

export type { GPUTier, CRTConfig, GPUInfo };