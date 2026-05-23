import {
  vertexShaderSource,
  fragmentShaderOverlay,
} from './shader-source.ts';

interface PipelineConfig {
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
  phosphorMaskIntensity: number;
  colorBleedIntensity: number;
  reflectionIntensity: number;
  cornerPinch: number;
  moiréScale: number;
}

/**
 * WebGL pipeline for rendering CRT screen-surface effects via an overlay canvas.
 * Creates its own offscreen canvas, compiles shaders, and renders a fullscreen quad.
 * Uses mediump precision for mobile compatibility.
 *
 * This overlay renders scanlines, noise, scanning beam, vignette, horizontal sync,
 * RGB shift, curvature, jitter, flicker, and bloom as a transparent layer over
 * the terminal content. Content-level effects (phosphor glow, text bloom) are
 * handled via CSS for better text rendering quality.
 */
export class WebGLPipeline {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private animationFrameId: number | null = null;
  private config: PipelineConfig;
  private isRunning = false;
  private contextLost = false;
  private boundContextLostHandler: ((event: Event) => void) | null = null;
  private boundContextRestoredHandler: (() => void) | null = null;

  // Uniform locations
  private uTime: WebGLUniformLocation | null = null;
  private uResolution: WebGLUniformLocation | null = null;
  private uScanlineIntensity: WebGLUniformLocation | null = null;
  private uBloomStrength: WebGLUniformLocation | null = null;
  private uCurvatureAmount: WebGLUniformLocation | null = null;
  private uFlickerRate: WebGLUniformLocation | null = null;
  private uNoiseIntensity: WebGLUniformLocation | null = null;
  private uBeamIntensity: WebGLUniformLocation | null = null;
  private uVignetteStrength: WebGLUniformLocation | null = null;
  private uHSyncIntensity: WebGLUniformLocation | null = null;
  private uRgbShift: WebGLUniformLocation | null = null;
  private uBrightness: WebGLUniformLocation | null = null;
  private uJitterIntensity: WebGLUniformLocation | null = null;
  private uPhosphorMaskIntensity: WebGLUniformLocation | null = null;
  private uColorBleedIntensity: WebGLUniformLocation | null = null;
  private uReflectionIntensity: WebGLUniformLocation | null = null;
  private uCornerPinch: WebGLUniformLocation | null = null;
  private uMoiréScale: WebGLUniformLocation | null = null;

  constructor(config: PipelineConfig) {
    this.config = config;
  }

  /**
   * Initialize the WebGL context, compile shaders, and set up geometry.
   * Returns true if initialization succeeded.
   */
  initialize(): boolean {
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';

    const gl = this.canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      return false;
    }

    this.gl = gl;

    // Handle context loss gracefully
    this.boundContextLostHandler = (event: Event) => {
      event.preventDefault();
      this.contextLost = true;
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    };

    this.boundContextRestoredHandler = () => {
      this.contextLost = false;
      this.reinitialize();
      if (this.isRunning) {
        this.scheduleRender();
      }
    };

    this.canvas.addEventListener(
      'webglcontextlost',
      this.boundContextLostHandler
    );
    this.canvas.addEventListener(
      'webglcontextrestored',
      this.boundContextRestoredHandler
    );

    return this.setupPipeline();
  }

  /**
   * Reinitialize the pipeline after context restoration.
   */
  private reinitialize(): boolean {
    if (!this.gl) return false;
    return this.setupPipeline();
  }

  /**
   * Compile shaders, link program, create buffers, and look up uniforms.
   */
  private setupPipeline(): boolean {
    const gl = this.gl;
    if (!gl) return false;

    const program = this.createProgram(gl, vertexShaderSource, fragmentShaderOverlay);
    if (!program) {
      return false;
    }

    this.program = program;
    gl.useProgram(program);

    // Look up uniforms
    this.uTime = gl.getUniformLocation(program, 'u_time');
    this.uResolution = gl.getUniformLocation(program, 'u_resolution');
    this.uScanlineIntensity = gl.getUniformLocation(program, 'u_scanlineIntensity');
    this.uBloomStrength = gl.getUniformLocation(program, 'u_bloomStrength');
    this.uCurvatureAmount = gl.getUniformLocation(program, 'u_curvatureAmount');
    this.uFlickerRate = gl.getUniformLocation(program, 'u_flickerRate');
    this.uNoiseIntensity = gl.getUniformLocation(program, 'u_noiseIntensity');
    this.uBeamIntensity = gl.getUniformLocation(program, 'u_beamIntensity');
    this.uVignetteStrength = gl.getUniformLocation(program, 'u_vignetteStrength');
    this.uHSyncIntensity = gl.getUniformLocation(program, 'u_hSyncIntensity');
    this.uRgbShift = gl.getUniformLocation(program, 'u_rgbShift');
    this.uBrightness = gl.getUniformLocation(program, 'u_brightness');
    this.uJitterIntensity = gl.getUniformLocation(program, 'u_jitterIntensity');
    this.uPhosphorMaskIntensity = gl.getUniformLocation(program, 'u_phosphorMaskIntensity');
    this.uColorBleedIntensity = gl.getUniformLocation(program, 'u_colorBleedIntensity');
    this.uReflectionIntensity = gl.getUniformLocation(program, 'u_reflectionIntensity');
    this.uCornerPinch = gl.getUniformLocation(program, 'u_cornerPinch');
    this.uMoiréScale = gl.getUniformLocation(program, 'u_moiréScale');

    // Create fullscreen quad (two triangles)
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const texCoords = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,
    ]);

    // Position buffer
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // TexCoord buffer
    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Enable blending for overlay
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return true;
  }

  /**
   * Compile a single shader.
   */
  private compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
  ): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Link vertex and fragment shaders into a program.
   */
  private createProgram(
    gl: WebGLRenderingContext,
    vertexSource: string,
    fragmentSource: string
  ): WebGLProgram | null {
    const vs = this.compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fs = this.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    if (!vs || !fs) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      return null;
    }

    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    // Shaders can be deleted after linking
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    return program;
  }

  /**
   * Start the render loop using requestAnimationFrame.
   */
  start(): void {
    if (this.isRunning || this.contextLost) return;
    this.isRunning = true;
    this.scheduleRender();
  }

  /**
   * Stop the render loop.
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Schedule the next frame.
   */
  private scheduleRender(): void {
    if (!this.isRunning || this.contextLost) return;
    this.animationFrameId = requestAnimationFrame((time) => {
      this.render(time);
      this.scheduleRender();
    });
  }

  /**
   * Render a single frame with current uniforms.
   * @param time - Current time in milliseconds
   */
  render(time: number): void {
    const gl = this.gl;
    if (!gl || !this.program || this.contextLost) return;

    gl.useProgram(this.program);

    // Set uniforms
    gl.uniform1f(this.uTime, time * 0.001);
    gl.uniform2f(
      this.uResolution,
      this.canvas!.width,
      this.canvas!.height
    );
    gl.uniform1f(this.uScanlineIntensity, this.config.scanlineIntensity);
    gl.uniform1f(this.uBloomStrength, this.config.bloomStrength);
    gl.uniform1f(this.uCurvatureAmount, this.config.curvatureAmount);
    gl.uniform1f(this.uFlickerRate, this.config.flickerRate);
    gl.uniform1f(this.uNoiseIntensity, this.config.noiseIntensity);
    gl.uniform1f(this.uBeamIntensity, this.config.beamIntensity);
    gl.uniform1f(this.uVignetteStrength, this.config.vignetteStrength);
    gl.uniform1f(this.uHSyncIntensity, this.config.hSyncIntensity);
    gl.uniform1f(this.uRgbShift, this.config.rgbShift);
    gl.uniform1f(this.uBrightness, this.config.brightness);
    gl.uniform1f(this.uJitterIntensity, this.config.jitterIntensity);
    gl.uniform1f(this.uPhosphorMaskIntensity, this.config.phosphorMaskIntensity);
    gl.uniform1f(this.uColorBleedIntensity, this.config.colorBleedIntensity);
    gl.uniform1f(this.uReflectionIntensity, this.config.reflectionIntensity);
    gl.uniform1f(this.uCornerPinch, this.config.cornerPinch);
    gl.uniform1f(this.uMoiréScale, this.config.moiréScale);

    // Draw fullscreen quad
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  /**
   * Resize the canvas and viewport.
   * @param width - Width in CSS pixels
   * @param height - Height in CSS pixels
   */
  resize(width: number, height: number): void {
    if (!this.canvas || !this.gl) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Update pipeline configuration.
   * @param config - New configuration values
   */
  updateConfig(config: PipelineConfig): void {
    this.config = config;
  }

  /**
   * Get the overlay canvas element.
   * @returns The canvas element, or null if not initialized
   */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /**
   * Clean up all WebGL resources.
   */
  destroy(): void {
    this.stop();

    if (this.canvas) {
      if (this.boundContextLostHandler) {
        this.canvas.removeEventListener('webglcontextlost', this.boundContextLostHandler);
      }
      if (this.boundContextRestoredHandler) {
        this.canvas.removeEventListener('webglcontextrestored', this.boundContextRestoredHandler);
      }
    }

    if (this.gl) {
      if (this.program) {
        this.gl.deleteProgram(this.program);
      }
      if (this.positionBuffer) {
        this.gl.deleteBuffer(this.positionBuffer);
      }
      if (this.texCoordBuffer) {
        this.gl.deleteBuffer(this.texCoordBuffer);
      }
    }

    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.positionBuffer = null;
    this.texCoordBuffer = null;
  }
}
