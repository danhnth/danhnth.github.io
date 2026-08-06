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
  vignetteStrength: number;
  brightness: number;
  jitterIntensity: number;
  phosphorMaskIntensity: number;
  cornerPinch: number;
  burnInStrength: number;
  sourceOpacity: number;
  hardScan: number;
  hardPix: number;
  beamMinWidth: number;
  beamMaxWidth: number;
  beamPower: number;
  maskPitch: number;
  maskDark: number;
  maskLight: number;
  bloomThreshold: number;
  bloomKnee: number;
  crtGamma: number;
  monitorGamma: number;
}

/**
 * WebGL pipeline for rendering CRT screen-surface effects via an overlay canvas.
 * Now supports content-aware rendering: samples the terminal DOM as a texture,
 * applies multi-pass bloom and burn-in, then renders the final CRT simulation.
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
  private needsRender = true;
  private sourceDirty = true;
  private lastFrameTime = 0;
  private boundContextLostHandler: ((event: Event) => void) | null = null;
  private boundContextRestoredHandler: (() => void) | null = null;
  private onContextLost: (() => void) | null = null;
  private onContextRestored: (() => void) | null = null;

  // Uniform locations
  private uTime: WebGLUniformLocation | null = null;
  private uResolution: WebGLUniformLocation | null = null;
  private uScanlineIntensity: WebGLUniformLocation | null = null;
  private uBloomStrength: WebGLUniformLocation | null = null;
  private uCurvatureAmount: WebGLUniformLocation | null = null;
  private uFlickerRate: WebGLUniformLocation | null = null;
  private uNoiseIntensity: WebGLUniformLocation | null = null;
  private uVignetteStrength: WebGLUniformLocation | null = null;
  private uBrightness: WebGLUniformLocation | null = null;
  private uJitterIntensity: WebGLUniformLocation | null = null;
  private uPhosphorMaskIntensity: WebGLUniformLocation | null = null;
  private uCornerPinch: WebGLUniformLocation | null = null;
  private uBurnInStrength: WebGLUniformLocation | null = null;
  private uSourceSize: WebGLUniformLocation | null = null;
  private uHardScan: WebGLUniformLocation | null = null;
  private uHardPix: WebGLUniformLocation | null = null;
  private uBeamMinWidth: WebGLUniformLocation | null = null;
  private uBeamMaxWidth: WebGLUniformLocation | null = null;
  private uBeamPower: WebGLUniformLocation | null = null;
  private uMaskPitch: WebGLUniformLocation | null = null;
  private uMaskDark: WebGLUniformLocation | null = null;
  private uMaskLight: WebGLUniformLocation | null = null;
  private uBloomThreshold: WebGLUniformLocation | null = null;
  private uBloomKnee: WebGLUniformLocation | null = null;
  private uCrtGamma: WebGLUniformLocation | null = null;
  private uMonitorGamma: WebGLUniformLocation | null = null;
  private uSourceOpacity: WebGLUniformLocation | null = null;

  // Texture uniforms
  private uSourceTexture: WebGLUniformLocation | null = null;
  private uNoiseTexture: WebGLUniformLocation | null = null;
  private uBloomTexture: WebGLUniformLocation | null = null;
  private uBurnInTexture: WebGLUniformLocation | null = null;

  // Textures
  private sourceTexture: WebGLTexture | null = null;
  private noiseTexture: WebGLTexture | null = null;
  private bloomTexture: WebGLTexture | null = null;

  // Burn-in ping-pong
  private burnInFramebuffers: [WebGLFramebuffer, WebGLFramebuffer] | null = null;
  private burnInTextures: [WebGLTexture, WebGLTexture] | null = null;
  private currentBurnInIndex = 0;

  // Bloom framebuffer
  private bloomFramebuffer: WebGLFramebuffer | null = null;

  // Capture canvas reference
  private captureCanvas: HTMLCanvasElement | null = null;

  // Bloom shader program
  private bloomProgram: WebGLProgram | null = null;
  private bloomPositionBuffer: WebGLBuffer | null = null;
  private bloomTexBuffer: WebGLBuffer | null = null;
  private uBloomSource: WebGLUniformLocation | null = null;
  private uBloomResolution: WebGLUniformLocation | null = null;

  // Burn-in shader program
  private burnInProgram: WebGLProgram | null = null;
  private burnInPositionBuffer: WebGLBuffer | null = null;
  private burnInTexBuffer: WebGLBuffer | null = null;
  private uBurnInPrev: WebGLUniformLocation | null = null;
  private uBurnInSource: WebGLUniformLocation | null = null;
  private uBurnInDecay: WebGLUniformLocation | null = null;
  private uBurnInResolution: WebGLUniformLocation | null = null;

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
    // reset.css caps canvas at max-width:100% (a responsive-image reset); the
    // overlay must be able to stretch over the terminal's full border box.
    this.canvas.style.maxWidth = 'none';
    this.canvas.style.maxHeight = 'none';
    this.canvas.style.pointerEvents = 'none';

    const gl = this.canvas.getContext('webgl', {
      alpha: false,
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
      this.onContextLost?.();
    };

    this.boundContextRestoredHandler = () => {
      this.contextLost = false;
      this.reinitialize();
      if (this.isRunning) {
        this.scheduleRender();
      }
      this.onContextRestored?.();
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
    this.sourceDirty = true;
    this.needsRender = true;
    return this.setupPipeline();
  }

  /**
   * Compile shaders, link program, create buffers, and look up uniforms.
   */
  private setupPipeline(): boolean {
    const gl = this.gl;
    if (!gl) return false;

    // Idempotent: context restoration re-runs this, so drop the old objects first.
    this.releaseGpuResources();

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
    this.uVignetteStrength = gl.getUniformLocation(program, 'u_vignetteStrength');
    this.uBrightness = gl.getUniformLocation(program, 'u_brightness');
    this.uJitterIntensity = gl.getUniformLocation(program, 'u_jitterIntensity');
    this.uPhosphorMaskIntensity = gl.getUniformLocation(program, 'u_phosphorMaskIntensity');
    this.uCornerPinch = gl.getUniformLocation(program, 'u_cornerPinch');
    this.uBurnInStrength = gl.getUniformLocation(program, 'u_burnInStrength');
    this.uSourceSize = gl.getUniformLocation(program, 'u_sourceSize');
    this.uHardScan = gl.getUniformLocation(program, 'u_hardScan');
    this.uHardPix = gl.getUniformLocation(program, 'u_hardPix');
    this.uBeamMinWidth = gl.getUniformLocation(program, 'u_beamMinWidth');
    this.uBeamMaxWidth = gl.getUniformLocation(program, 'u_beamMaxWidth');
    this.uBeamPower = gl.getUniformLocation(program, 'u_beamPower');
    this.uMaskPitch = gl.getUniformLocation(program, 'u_maskPitch');
    this.uMaskDark = gl.getUniformLocation(program, 'u_maskDark');
    this.uMaskLight = gl.getUniformLocation(program, 'u_maskLight');
    this.uBloomThreshold = gl.getUniformLocation(program, 'u_bloomThreshold');
    this.uBloomKnee = gl.getUniformLocation(program, 'u_bloomKnee');
    this.uCrtGamma = gl.getUniformLocation(program, 'u_crtGamma');
    this.uMonitorGamma = gl.getUniformLocation(program, 'u_monitorGamma');
    this.uSourceOpacity = gl.getUniformLocation(program, 'u_sourceOpacity');

    // Texture uniforms
    this.uSourceTexture = gl.getUniformLocation(program, 'u_sourceTexture');
    this.uNoiseTexture = gl.getUniformLocation(program, 'u_noiseTexture');
    this.uBloomTexture = gl.getUniformLocation(program, 'u_bloomTexture');
    this.uBurnInTexture = gl.getUniformLocation(program, 'u_burnInTexture');

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

    // TexCoord buffer
    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    // Disable blending — we output full opacity now
    gl.disable(gl.BLEND);

    // Create source texture (initially empty)
    this.sourceTexture = gl.createTexture();

    // Generate noise texture
    this.noiseTexture = this.generateNoiseTexture();

    // Create bloom framebuffer + texture
    this.setupBloomResources();

    // Create burn-in ping-pong framebuffers
    this.setupBurnInResources();

    // Setup bloom shader program
    this.setupBloomProgram();

    // Setup burn-in shader program
    this.setupBurnInProgram();

    // Add class to canvas for DOM capture filtering
    if (this.canvas) {
      this.canvas.className = 'crt-webgl-overlay';
    }

    return true;
  }

  /**
   * Release bloom pass GPU resources. Safe to call when nothing is allocated.
   */
  private releaseBloomResources(): void {
    const gl = this.gl;
    if (!gl) return;

    if (this.bloomFramebuffer) {
      gl.deleteFramebuffer(this.bloomFramebuffer);
      this.bloomFramebuffer = null;
    }
    if (this.bloomTexture) {
      gl.deleteTexture(this.bloomTexture);
      this.bloomTexture = null;
    }
  }

  /**
   * Release burn-in ping-pong GPU resources. Safe to call when nothing is allocated.
   */
  private releaseBurnInResources(): void {
    const gl = this.gl;
    if (!gl) return;

    if (this.burnInFramebuffers) {
      gl.deleteFramebuffer(this.burnInFramebuffers[0]);
      gl.deleteFramebuffer(this.burnInFramebuffers[1]);
      this.burnInFramebuffers = null;
    }
    if (this.burnInTextures) {
      gl.deleteTexture(this.burnInTextures[0]);
      gl.deleteTexture(this.burnInTextures[1]);
      this.burnInTextures = null;
    }
    this.currentBurnInIndex = 0;
  }

  /**
   * Setup bloom pass resources (framebuffer + texture).
   * Idempotent: any previously allocated resources are released first.
   */
  private setupBloomResources(): void {
    const gl = this.gl;
    if (!gl || !this.canvas) return;

    this.releaseBloomResources();

    const width = Math.floor(this.canvas.width / 2);
    const height = Math.floor(this.canvas.height / 2);

    this.bloomTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.bloomTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.bloomFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.bloomTexture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /**
   * Setup burn-in ping-pong framebuffers and textures.
   * Idempotent: any previously allocated resources are released first.
   */
  private setupBurnInResources(): void {
    const gl = this.gl;
    if (!gl || !this.canvas) return;

    this.releaseBurnInResources();

    const width = this.canvas.width;
    const height = this.canvas.height;

    const fb0 = this.createFramebuffer(width, height);
    const fb1 = this.createFramebuffer(width, height);

    if (!fb0 || !fb1) {
      if (fb0) {
        gl.deleteFramebuffer(fb0.fb);
        gl.deleteTexture(fb0.texture);
      }
      if (fb1) {
        gl.deleteFramebuffer(fb1.fb);
        gl.deleteTexture(fb1.texture);
      }
      return;
    }

    this.burnInFramebuffers = [fb0.fb, fb1.fb];
    this.burnInTextures = [fb0.texture, fb1.texture];
    this.currentBurnInIndex = 0;
  }

  /**
   * Create a framebuffer + texture pair for offscreen rendering.
   */
  private createFramebuffer(
    width: number,
    height: number
  ): { fb: WebGLFramebuffer; texture: WebGLTexture } | null {
    const gl = this.gl;
    if (!gl) return null;

    const texture = gl.createTexture();
    if (!texture) return null;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const fb = gl.createFramebuffer();
    if (!fb) {
      gl.deleteTexture(texture);
      return null;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return { fb, texture };
  }

  /**
   * Setup the bloom shader program (simple 9-tap box blur).
   */
  private setupBloomProgram(): void {
    const gl = this.gl;
    if (!gl) return;

    const bloomVertexSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const bloomFragmentSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_source;
      uniform vec2 u_resolution;

      void main() {
        vec2 texelSize = 1.0 / u_resolution;
        vec3 result = vec3(0.0);

        // 9-tap box blur
        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            result += texture2D(u_source, v_texCoord + offset).rgb;
          }
        }

        gl_FragColor = vec4(result / 9.0, 1.0);
      }
    `;

    const program = this.createProgram(gl, bloomVertexSource, bloomFragmentSource);
    if (!program) return;

    this.bloomProgram = program;

    // Bloom buffers
    this.bloomPositionBuffer = gl.createBuffer();
    const positions = new Float32Array([
      -1, -1,  1, -1,  -1, 1,  -1, 1,  1, -1,  1, 1,
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bloomPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    this.bloomTexBuffer = gl.createBuffer();
    const texCoords = new Float32Array([
      0, 0,  1, 0,  0, 1,  0, 1,  1, 0,  1, 1,
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bloomTexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    this.uBloomSource = gl.getUniformLocation(program, 'u_source');
    this.uBloomResolution = gl.getUniformLocation(program, 'u_resolution');
  }

  /**
   * Setup the burn-in shader program (phosphor persistence accumulation).
   * Blends previous burn-in frame with current source using decay.
   */
  private setupBurnInProgram(): void {
    const gl = this.gl;
    if (!gl) return;

    const burnInVertexSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const burnInFragmentSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_prevBurnIn;
      uniform sampler2D u_source;
      uniform float u_decay;

      void main() {
        vec3 prev = texture2D(u_prevBurnIn, v_texCoord).rgb * u_decay;
        vec3 curr = texture2D(u_source, v_texCoord).rgb;
        vec3 blended = max(prev, curr);
        gl_FragColor = vec4(blended, 1.0);
      }
    `;

    const program = this.createProgram(gl, burnInVertexSource, burnInFragmentSource);
    if (!program) return;

    this.burnInProgram = program;

    // Burn-in buffers
    this.burnInPositionBuffer = gl.createBuffer();
    const positions = new Float32Array([
      -1, -1,  1, -1,  -1, 1,  -1, 1,  1, -1,  1, 1,
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.burnInPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    this.burnInTexBuffer = gl.createBuffer();
    const texCoords = new Float32Array([
      0, 0,  1, 0,  0, 1,  0, 1,  1, 0,  1, 1,
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.burnInTexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    this.uBurnInPrev = gl.getUniformLocation(program, 'u_prevBurnIn');
    this.uBurnInSource = gl.getUniformLocation(program, 'u_source');
    this.uBurnInDecay = gl.getUniformLocation(program, 'u_decay');
    this.uBurnInResolution = gl.getUniformLocation(program, 'u_resolution');
  }

  /**
   * Generate a 512x512 RGBA noise texture using a temporary 2D canvas.
   */
  private generateNoiseTexture(): WebGLTexture | null {
    const gl = this.gl;
    if (!gl) return null;

    const size = 512;
    const offscreen = document.createElement('canvas');
    offscreen.width = size;
    offscreen.height = size;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return null;

    const imageData = ctx.createImageData(size, size);
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = Math.random() * 255;     // R
      imageData.data[i + 1] = Math.random() * 255; // G
      imageData.data[i + 2] = Math.random() * 255; // B
      imageData.data[i + 3] = 255;                  // A
    }
    ctx.putImageData(imageData, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offscreen);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    return texture;
  }

  /**
   * Upload the captured terminal canvas to sourceTexture.
   */
  updateSourceTexture(canvas: HTMLCanvasElement): void {
    const gl = this.gl;
    if (!gl || !this.sourceTexture) return;

    this.captureCanvas = canvas;
    this.sourceDirty = true;
    this.needsRender = true;

    gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
    // A canvas/DOM image has its origin at the TOP-left, while GL texture
    // space starts at the BOTTOM-left. Without this flip the whole screen
    // renders upside down.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    // NEAREST: the shader reconstructs the beam from discrete texels itself.
    // Hardware bilinear would pre-smear the signal and defeat that filter.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  /**
   * Render bloom pass: 9-tap box blur on sourceTexture at half resolution.
   */
  private renderBloomPass(): void {
    const gl = this.gl;
    if (!gl || !this.bloomProgram || !this.sourceTexture || !this.bloomFramebuffer) return;

    const width = Math.floor((this.canvas?.width ?? 1) / 2);
    const height = Math.floor((this.canvas?.height ?? 1) / 2);

    // Bind bloom framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFramebuffer);
    gl.viewport(0, 0, width, height);

    gl.useProgram(this.bloomProgram);

    // Bind source texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
    gl.uniform1i(this.uBloomSource, 0);
    gl.uniform2f(this.uBloomResolution, width, height);

    this.bindQuadAttributes(this.bloomProgram, this.bloomPositionBuffer, this.bloomTexBuffer);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  /**
   * Render burn-in pass: blend source with previous burn-in using decay, write to next buffer.
   */
  private renderBurnInPass(): void {
    const gl = this.gl;
    if (!gl || !this.burnInProgram || !this.burnInFramebuffers || !this.burnInTextures || !this.sourceTexture) return;

    const width = this.canvas?.width ?? 1;
    const height = this.canvas?.height ?? 1;

    const readIndex = this.currentBurnInIndex;
    const writeIndex = 1 - this.currentBurnInIndex;

    // Bind write framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.burnInFramebuffers[writeIndex]);
    gl.viewport(0, 0, width, height);

    gl.useProgram(this.burnInProgram);

    // Bind previous burn-in texture to unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.burnInTextures[readIndex]);
    gl.uniform1i(this.uBurnInPrev, 0);

    // Bind source texture to unit 1
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
    gl.uniform1i(this.uBurnInSource, 1);

    // Decay factor: ~0.92 for 1-second persistence at 60fps
    gl.uniform1f(this.uBurnInDecay, 0.92);
    gl.uniform2f(this.uBurnInResolution, width, height);

    this.bindQuadAttributes(this.burnInProgram, this.burnInPositionBuffer, this.burnInTexBuffer);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Flip index
    this.currentBurnInIndex = writeIndex;
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
   * Bind a quad's vertex buffers and re-establish attribute pointers.
   * Every pass must call this: attribute state is global in WebGL, so a
   * previous pass's bindings would otherwise leak into this draw.
   */
  private bindQuadAttributes(
    program: WebGLProgram,
    positionBuffer: WebGLBuffer | null,
    texCoordBuffer: WebGLBuffer | null
  ): void {
    const gl = this.gl;
    if (!gl || !positionBuffer || !texCoordBuffer) return;

    const posLoc = gl.getAttribLocation(program, 'a_position');
    if (posLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    }

    const texLoc = gl.getAttribLocation(program, 'a_texCoord');
    if (texLoc >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.enableVertexAttribArray(texLoc);
      gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);
    }
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
    const canvas = this.canvas;
    if (!gl || !canvas || !this.program || this.contextLost) return;

    // Wait for first capture
    if (!this.sourceTexture || !this.captureCanvas) return;

    // Demand-driven rendering: with all animated params at 0 the output only
    // changes when a new capture arrives, so idle frames cost zero GPU work.
    // Animated mode is capped at ~30fps — the flicker/jitter hashes quantize
    // time anyway, so 60fps doubles GPU cost with no visible difference.
    const animated =
      this.config.flickerRate > 0 ||
      this.config.jitterIntensity > 0 ||
      this.config.noiseIntensity > 0 ||
      this.config.burnInStrength > 0;

    if (!animated && !this.needsRender) return;
    if (animated && time - this.lastFrameTime < 30) return;
    this.lastFrameTime = time;
    this.needsRender = false;

    // Bloom depends only on the source texture — re-blur only on new capture.
    if (this.sourceDirty) {
      this.renderBloomPass();
      this.sourceDirty = false;
    }
    // Burn-in is temporal decay; skip entirely when its strength is 0.
    if (this.config.burnInStrength > 0) {
      this.renderBurnInPass();
    }

    // Bind default framebuffer (screen)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.useProgram(this.program);

    // Set uniforms
    gl.uniform1f(this.uTime, time * 0.001);
    gl.uniform2f(this.uResolution, canvas.width, canvas.height);
    gl.uniform1f(this.uScanlineIntensity, this.config.scanlineIntensity);
    gl.uniform1f(this.uBloomStrength, this.config.bloomStrength);
    gl.uniform1f(this.uCurvatureAmount, this.config.curvatureAmount);
    gl.uniform1f(this.uFlickerRate, this.config.flickerRate);
    gl.uniform1f(this.uNoiseIntensity, this.config.noiseIntensity);
    gl.uniform1f(this.uVignetteStrength, this.config.vignetteStrength);
    gl.uniform1f(this.uBrightness, this.config.brightness);
    gl.uniform1f(this.uJitterIntensity, this.config.jitterIntensity);
    gl.uniform1f(this.uPhosphorMaskIntensity, this.config.phosphorMaskIntensity);
    gl.uniform1f(this.uCornerPinch, this.config.cornerPinch);
    gl.uniform1f(this.uBurnInStrength, this.config.burnInStrength);
    gl.uniform1f(this.uHardScan, this.config.hardScan);
    gl.uniform1f(this.uHardPix, this.config.hardPix);
    gl.uniform1f(this.uBeamMinWidth, this.config.beamMinWidth);
    gl.uniform1f(this.uBeamMaxWidth, this.config.beamMaxWidth);
    gl.uniform1f(this.uBeamPower, this.config.beamPower);
    gl.uniform1f(this.uMaskPitch, this.config.maskPitch);
    gl.uniform1f(this.uMaskDark, this.config.maskDark);
    gl.uniform1f(this.uMaskLight, this.config.maskLight);
    gl.uniform1f(this.uBloomThreshold, this.config.bloomThreshold);
    gl.uniform1f(this.uBloomKnee, this.config.bloomKnee);
    gl.uniform1f(this.uCrtGamma, this.config.crtGamma);
    gl.uniform1f(this.uMonitorGamma, this.config.monitorGamma);

    // The emulated raster size the beam reconstruction samples against.
    const srcW = this.captureCanvas.width;
    const srcH = this.captureCanvas.height;
    gl.uniform2f(this.uSourceSize, srcW, srcH);
    gl.uniform1f(this.uSourceOpacity, this.config.sourceOpacity);

    // Set texture uniforms
    gl.uniform1i(this.uSourceTexture, 0);
    gl.uniform1i(this.uNoiseTexture, 1);
    gl.uniform1i(this.uBloomTexture, 2);
    gl.uniform1i(this.uBurnInTexture, 3);

    // Bind textures to texture units
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.noiseTexture);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.bloomTexture);

    gl.activeTexture(gl.TEXTURE3);
    if (this.burnInTextures) {
      gl.bindTexture(gl.TEXTURE_2D, this.burnInTextures[this.currentBurnInIndex]);
    }

    this.bindQuadAttributes(this.program, this.positionBuffer, this.texCoordBuffer);

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

    // Cap at 1x: the DOM source texture is captured at pixelRatio 1, the CRT
    // shader reconstructs scanlines/grille from u_sourceSize anyway, and the
    // main pass costs 11+ texture fetches per fragment across 3 passes —
    // rendering above 1x quadruples integrated-GPU cost for no visible gain.
    const dpr = Math.min(window.devicePixelRatio || 1, 1);
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    // Recreate bloom resources at new size
    this.setupBloomResources();

    // Recreate burn-in resources at new size
    this.setupBurnInResources();

    this.sourceDirty = true;
    this.needsRender = true;
  }

  /**
   * Update pipeline configuration.
   * @param config - New configuration values
   */
  updateConfig(config: PipelineConfig): void {
    this.config = config;
    this.sourceDirty = true;
    this.needsRender = true;
  }

  setContextEventCallbacks(
    onLost: (() => void) | null,
    onRestored: (() => void) | null
  ): void {
    this.onContextLost = onLost;
    this.onContextRestored = onRestored;
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

    this.releaseGpuResources();

    this.canvas = null;
    this.gl = null;
    this.captureCanvas = null;
  }

  /**
   * Delete every GPU object this pipeline owns and null out its handle.
   * Used by both destroy() and setupPipeline() so context restoration
   * cannot orphan the previous context's resources.
   */
  private releaseGpuResources(): void {
    const gl = this.gl;
    if (!gl) return;

    this.releaseBloomResources();
    this.releaseBurnInResources();

    if (this.program) {
      gl.deleteProgram(this.program);
      this.program = null;
    }
    if (this.bloomProgram) {
      gl.deleteProgram(this.bloomProgram);
      this.bloomProgram = null;
    }
    if (this.burnInProgram) {
      gl.deleteProgram(this.burnInProgram);
      this.burnInProgram = null;
    }

    if (this.positionBuffer) {
      gl.deleteBuffer(this.positionBuffer);
      this.positionBuffer = null;
    }
    if (this.texCoordBuffer) {
      gl.deleteBuffer(this.texCoordBuffer);
      this.texCoordBuffer = null;
    }
    if (this.bloomPositionBuffer) {
      gl.deleteBuffer(this.bloomPositionBuffer);
      this.bloomPositionBuffer = null;
    }
    if (this.bloomTexBuffer) {
      gl.deleteBuffer(this.bloomTexBuffer);
      this.bloomTexBuffer = null;
    }
    if (this.burnInPositionBuffer) {
      gl.deleteBuffer(this.burnInPositionBuffer);
      this.burnInPositionBuffer = null;
    }
    if (this.burnInTexBuffer) {
      gl.deleteBuffer(this.burnInTexBuffer);
      this.burnInTexBuffer = null;
    }

    if (this.sourceTexture) {
      gl.deleteTexture(this.sourceTexture);
      this.sourceTexture = null;
    }
    if (this.noiseTexture) {
      gl.deleteTexture(this.noiseTexture);
      this.noiseTexture = null;
    }
  }
}
