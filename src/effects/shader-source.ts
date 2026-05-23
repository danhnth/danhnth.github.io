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
uniform float u_phosphorMaskIntensity;
uniform float u_colorBleedIntensity;
uniform float u_reflectionIntensity;
uniform float u_cornerPinch;
uniform float u_moiréScale;

// ── Hash / Noise Functions ──────────────────────────────────

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hash1(float n) {
  return fract(sin(n) * 43758.5453);
}

// Value noise with interpolation
float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Structured/banded noise for analog interference
float bandedNoise(vec2 st, float time) {
  float band = floor(st.y * 40.0 + time * 2.0);
  float bandHash = hash1(band * 17.3 + time * 0.5);
  float fineNoise = noise(st * vec2(8.0, 2.0) + time * 3.0);
  return bandHash * 0.7 + fineNoise * 0.3;
}

// ── Barrel Distortion with Corner Pinch ─────────────────────

vec2 barrelDistort(vec2 uv, float curvature, float cornerPinch) {
  vec2 centered = uv - 0.5;
  float r = length(centered);

  // Base barrel distortion
  float barrel = 1.0 + curvature * r * r;

  // Corner pinch: extra distortion near corners
  float cornerFactor = abs(centered.x * centered.y) * 4.0;
  float pinch = 1.0 + cornerPinch * cornerFactor * r;

  vec2 distorted = centered * barrel * pinch + 0.5;
  return clamp(distorted, 0.0, 1.0);
}

// ── Aperture Grille / Phosphor Mask ─────────────────────────

float phosphorMask(vec2 uv, float intensity) {
  // RGB vertical stripe pattern at sub-pixel level
  float stripe = sin(uv.x * u_resolution.x * 3.14159 * 1.0) * 0.5 + 0.5;
  // Sharpen the mask
  stripe = pow(stripe, 0.6);
  return mix(1.0, stripe, intensity);
}

// ── Organic Scanline Moiré ──────────────────────────────────

float organicScanlines(vec2 uv, float time, float moireScale) {
  // Base scanline
  float baseScanline = sin(uv.y * u_resolution.y * 3.14159) * 0.5 + 0.5;
  baseScanline = pow(baseScanline, 0.4);

  // Moiré interference: slightly offset frequency layers
  float moire1 = sin(uv.y * u_resolution.y * 3.14159 * moireScale + time * 0.7) * 0.5 + 0.5;
  float moire2 = sin(uv.y * u_resolution.y * 3.14159 * moireScale * 1.02 + time * 0.3) * 0.5 + 0.5;

  // Combine with slight phase variation for organic feel
  float interference = mix(moire1, moire2, 0.5);
  interference = pow(interference, 0.5);

  return mix(baseScanline, interference, 0.3);
}

// ── Horizontal Color Bleed / Smear ──────────────────────────

float colorBleed(vec2 uv, float intensity, float time) {
  // Simulate signal delay causing horizontal smear
  float bleed = 0.0;
  float delay = 0.003 * intensity;
  for (int i = 1; i <= 4; i++) {
    float fi = float(i);
    bleed += sin((uv.x + delay * fi) * u_resolution.x * 0.5 + time * fi * 2.0) * (0.5 / fi);
  }
  return bleed * intensity * 0.15;
}

// ── Glass Glare / Screen Reflection ─────────────────────────

float glassGlare(vec2 uv, float intensity, float time) {
  // Subtle angled highlight that shifts slightly
  float angle = 0.3 + sin(time * 0.1) * 0.05;
  float glareLine = uv.x * cos(angle) + uv.y * sin(angle);
  float glare = smoothstep(0.45, 0.55, glareLine) * smoothstep(0.65, 0.55, glareLine);
  // Soften and scale
  glare *= exp(-pow((uv.y - 0.3) * 3.0, 2.0));
  return glare * intensity;
}

// ── Horizontal Sync Tearing ─────────────────────────────────

float hSyncTear(vec2 uv, float time, float intensity) {
  // Occasional horizontal displacement wave mimicking analog signal loss
  float syncPhase = fract(time * 0.15);
  float syncOn = smoothstep(0.0, 0.03, syncPhase) * smoothstep(0.15, 0.1, syncPhase);

  // Multiple tear lines at different frequencies
  float tear1 = sin(uv.y * 120.0 + time * 18.0) * syncOn;
  float tear2 = sin(uv.y * 250.0 + time * 12.0) * syncOn * 0.5;
  float tear3 = step(0.7, sin(uv.y * 400.0 + time * 8.0)) * syncOn * 0.3;

  return (tear1 + tear2 + tear3) * intensity;
}

// ── Vignette with Barrel-Corrected Falloff ──────────────────

float barrelVignette(vec2 uv, float strength, float curvature) {
  vec2 centered = uv - 0.5;
  float r = length(centered);
  // Use barrel-corrected distance for more natural falloff
  float barrelR = r * (1.0 + curvature * r * r);
  float vignette = smoothstep(0.8, 0.3, barrelR);
  return mix(1.0, vignette, strength);
}

// ── Phosphor Persistence Glow (Bloom) ───────────────────────

float phosphorBloom(vec2 uv, float strength, float time) {
  // Subtle bloom from bright areas — approximated with radial glow
  vec2 centered = uv - 0.5;
  float r = length(centered);
  float bloom = exp(-r * r * 6.0) * strength * 0.12;

  // Add time-varying phosphor persistence
  float persistence = sin(time * 1.5 + r * 10.0) * 0.5 + 0.5;
  bloom *= (0.7 + persistence * 0.3);

  return bloom;
}

// ── Main Fragment Shader ────────────────────────────────────

void main() {
  vec2 uv = v_texCoord;
  float time = u_time;

  // === JITTER (applied before distortion) ===
  float jitterX = (hash(vec2(floor(time * 30.0), 0.0)) - 0.5) * u_jitterIntensity;
  float jitterY = (hash(vec2(0.0, floor(time * 30.0))) - 0.5) * u_jitterIntensity * 0.5;
  uv += vec2(jitterX, jitterY);

  // === BARREL DISTORTION WITH CORNER PINCH ===
  vec2 curvedUV = barrelDistort(uv, u_curvatureAmount, u_cornerPinch);

  // === CHROMATIC ABERRATION (per-channel radial) ===
  vec2 centered = curvedUV - 0.5;
  float r = length(centered);
  float aberration = u_rgbShift * r * r;
  float rAngle = sin(time * 0.5) * aberration;
  float bAngle = -cos(time * 0.3) * aberration;

  // Per-channel radial offset
  vec2 rOffset = normalize(centered + 0.001) * rAngle;
  vec2 bOffset = normalize(centered + 0.001) * bAngle;

  // === HORIZONTAL SYNC TEARING ===
  float hSync = hSyncTear(curvedUV, time, u_hSyncIntensity);

  // === ORGANIC SCANLINES WITH MOIRÉ ===
  float scanline = organicScanlines(curvedUV, time, u_moiréScale);
  float scanlineDarken = scanline * u_scanlineIntensity;

  // === PHOSPHOR MASK (APERTURE GRILLE) ===
  float phosphor = phosphorMask(curvedUV, u_phosphorMaskIntensity);

  // === COLOR BLEED / HORIZONTAL SMEAR ===
  float bleed = colorBleed(curvedUV, u_colorBleedIntensity, time);

  // === GLASS GLARE / REFLECTION ===
  float glare = glassGlare(curvedUV, u_reflectionIntensity, time);

  // === STRUCTURED SIGNAL NOISE ===
  float structuredNoise = bandedNoise(curvedUV, time);
  float noiseVal = (structuredNoise - 0.5) * u_noiseIntensity;

  // === SCANNING BEAM ===
  float beamY = fract(time * 0.2);
  float beamDist = abs(curvedUV.y - beamY);
  float beam = exp(-beamDist * beamDist * 600.0) * u_beamIntensity;
  float trailY = fract(beamY - 0.05);
  float trailDist = abs(curvedUV.y - trailY);
  float trail = exp(-trailDist * trailDist * 200.0) * u_beamIntensity * 0.4;

  // === BARREL-CORRECTED VIGNETTE ===
  float vignette = barrelVignette(curvedUV, u_vignetteStrength, u_curvatureAmount);

  // === PHOSPHOR BLOOM ===
  float bloom = phosphorBloom(curvedUV, u_bloomStrength, time);

  // === FLICKER ===
  float flicker = 1.0 + (hash(vec2(floor(time * 60.0), 0.0)) - 0.5) * u_flickerRate;

  // === BURN-IN ===
  float burnIn = smoothstep(0.4, 0.0, r) * 0.02;

  // === BRIGHTNESS ===
  float brightness = u_brightness;

  // ── Combine Effects ──────────────────────────────────────

  // Darken from scanlines and vignette
  float darken = (scanlineDarken + (1.0 - vignette)) * flicker;

  // Brighten from beam, bloom, burn-in
  float brighten = (beam + trail + bloom + burnIn) * flicker * brightness;

  // Grain from structured noise
  float grain = noiseVal * flicker;

  // H-sync displacement
  float hSyncBright = abs(hSync) * flicker * 0.3;

  // Color bleed contribution
  float bleedBright = abs(bleed) * flicker * 0.2;

  // Glass glare
  float glareBright = glare * flicker;

  // ── RGB Channel Assembly ─────────────────────────────────

  // Apply chromatic aberration offsets per channel
  vec2 rUV = clamp(curvedUV + rOffset, 0.0, 1.0);
  vec2 bUV = clamp(curvedUV + bOffset, 0.0, 1.0);

  // Base signal per channel (using distorted UVs for R/B shift)
  float rSignal = brighten + grain * 0.5 + hSyncBright + bleedBright;
  float gSignal = brighten + grain + hSyncBright + bleedBright;
  float bSignal = brighten + grain * 0.5 + hSyncBright + bleedBright;

  // Apply phosphor mask to each channel
  float rMask = mix(1.0, phosphor, u_phosphorMaskIntensity * 0.5);
  float gMask = phosphor;
  float bMask = mix(1.0, phosphor, u_phosphorMaskIntensity * 0.5);

  vec3 color;
  color.r = rSignal * rMask;
  color.g = gSignal * gMask;
  color.b = bSignal * bMask;

  // Add phosphor tint to glow areas
  vec3 phosphorColor = vec3(0.15, 0.8, 0.25);
  vec3 trailColor = vec3(0.08, 0.5, 0.15);
  color += phosphorColor * beam;
  color += trailColor * trail;

  // Add h-sync artifacts
  color += vec3(0.1, 0.3, 0.1) * hSyncBright;

  // Add glass glare as white highlight
  color += vec3(glareBright);

  // ── Alpha Compositing ────────────────────────────────────

  float darkAlpha = darken * 0.5;
  float brightAlpha = (beam + trail + abs(grain) + hSyncBright + bloom + bleedBright + glareBright) * 0.45;
  float alpha = darkAlpha + brightAlpha;
  alpha = clamp(alpha, 0.0, 0.65);

  // Clamp color
  color = clamp(color, 0.0, 0.8);

  gl_FragColor = vec4(color, alpha);
}
`;
