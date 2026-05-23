/**
 * GLSL shader source code for CRT terminal overlay effects.
 * These shaders render CRT screen-surface artifacts (scanlines, noise, beam,
 * vignette, horizontal sync) on a transparent overlay canvas.
 * Content effects (glow, RGB shift, brightness, jitter, burn-in) are handled via CSS.
 */

export const vertexShaderSource = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

export const fragmentShaderOverlay = `
precision mediump float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_scanlineIntensity;
uniform float u_bloomStrength;
uniform float u_curvatureAmount;
uniform float u_flickerRate;
uniform float u_noiseIntensity;
uniform float u_beamIntensity;
uniform float u_vignetteStrength;
uniform float u_hSyncIntensity;
uniform float u_rgbShift;
uniform float u_brightness;
uniform float u_jitterIntensity;

// Random/hash function for noise
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D noise with interpolation
float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = v_texCoord;
  float time = u_time;
  vec2 centered = uv - 0.5;
  float dist = length(centered);

  // === RGB SHIFT (chromatic aberration) ===
  // Slight color channel misalignment at screen edges
  float rgbOffset = u_rgbShift * dist * dist;
  float rShift = rgbOffset * sin(time * 0.5);
  float bShift = -rgbOffset * cos(time * 0.3);

  // === JITTER ===
  // Subtle random signal instability
  float jitterX = (random(vec2(floor(time * 30.0), 0.0)) - 0.5) * u_jitterIntensity;
  float jitterY = (random(vec2(0.0, floor(time * 30.0))) - 0.5) * u_jitterIntensity * 0.5;
  uv += vec2(jitterX, jitterY);

  // === SCREEN CURVATURE ===
  // Barrel distortion warping UVs toward center
  float distortion = 1.0 + u_curvatureAmount * dist * dist;
  vec2 curvedUV = centered * distortion + 0.5;

  // Clamp to avoid artifacts at extreme edges
  curvedUV = clamp(curvedUV, 0.0, 1.0);

  // === HORIZONTAL SYNC ===
  // Occasional horizontal displacement wave
  float hSyncPhase = fract(time * 0.25);
  float hSyncOn = smoothstep(0.0, 0.02, hSyncPhase) * smoothstep(0.12, 0.08, hSyncPhase);
  float hSyncWave = sin(curvedUV.y * 80.0 + time * 15.0) * hSyncOn * u_hSyncIntensity;
  float hSyncLine = step(0.6, sin(curvedUV.y * 200.0 + time * 10.0)) * hSyncOn * u_hSyncIntensity * 0.5;

  // === SCANLINES (Rasterization) ===
  // Visible horizontal scan lines characteristic of CRT
  float scanline = sin(curvedUV.y * u_resolution.y * 3.14159) * 0.5 + 0.5;
  scanline = pow(scanline, 0.4);
  float scanlineDarken = scanline * u_scanlineIntensity;

  // === STATIC NOISE ===
  // Animated grain over the image
  float staticNoise = noise(curvedUV * u_resolution * 0.5 + time * 60.0);
  float noiseVal = (staticNoise - 0.5) * u_noiseIntensity;

  // === GLOWING LINE / SCANNING BEAM ===
  // A bright horizontal scanning beam effect
  float beamY = fract(time * 0.2);
  float beamDist = abs(curvedUV.y - beamY);
  // Main beam
  float beam = exp(-beamDist * beamDist * 600.0) * u_beamIntensity;
  // Soft trail behind beam
  float trailY = fract(beamY - 0.05);
  float trailDist = abs(curvedUV.y - trailY);
  float trail = exp(-trailDist * trailDist * 200.0) * u_beamIntensity * 0.4;

  // === VIGNETTE ===
  // Edge darkening simulating curved glass and electron beam falloff
  float vignette = dist * dist * u_vignetteStrength * 2.0;

  // === BURN-IN (subtle phosphor persistence) ===
  // Very faint static ghosting at center
  float burnIn = smoothstep(0.4, 0.0, dist) * 0.02;

  // === BLOOM (glow bleed) ===
  // Simulated by adding glow around bright areas
  float bloomGlow = exp(-dist * dist * 8.0) * u_bloomStrength * 0.1;

  // === FLICKERING ===
  // Subtle brightness fluctuations
  float flicker = 1.0 + (random(vec2(floor(time * 60.0), 0.0)) - 0.5) * u_flickerRate;

  // === CHROMA COLOR (phosphor tint) ===
  // Green phosphor characteristic - already in CSS but enhance in shader
  vec3 phosphorColor = vec3(0.15, 0.8, 0.25); // green phosphor glow
  vec3 trailColor = vec3(0.08, 0.5, 0.15);   // dimmer green for trail

  // === BRIGHTNESS ===
  float brightness = u_brightness;

  // Combine effects
  // Darken from scanlines and vignette
  float darken = (scanlineDarken + vignette) * flicker;
  // Brighten from beam, bloom, and burn-in
  float brighten = (beam + trail + bloomGlow + burnIn) * flicker * brightness;
  // Grain from noise
  float grain = noiseVal * flicker;
  // H-sync displacement brightness
  float hSyncBright = hSyncLine * flicker;

  // RGB channel separation for chromatic aberration
  vec3 color = vec3(0.0);
  color.r = (brighten + grain * 0.5) * (1.0 + rShift * 10.0);
  color.g = (brighten + grain) * (1.0 + bloomGlow * 2.0);
  color.b = (brighten + grain * 0.5) * (1.0 + bShift * 10.0);

  // Add phosphor tint to glow areas
  color += phosphorColor * beam;
  color += trailColor * trail;

  // Add h-sync artifacts
  color += vec3(0.1, 0.3, 0.1) * hSyncBright;

  // Darken areas (scanlines + vignette)
  float darkAlpha = darken * 0.6;

  // Bright areas (beam, bloom, noise, h-sync)
  float brightAlpha = (beam + trail + abs(grain) + hSyncBright + bloomGlow) * 0.5;

  // Total alpha: dark areas darken, bright areas brighten
  float alpha = darkAlpha + brightAlpha;
  alpha = clamp(alpha, 0.0, 0.65);

  // Clamp color
  color = clamp(color, 0.0, 0.8);

  gl_FragColor = vec4(color, alpha);
}
`;
