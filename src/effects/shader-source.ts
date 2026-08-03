/**
 * GLSL shader source for the CRT terminal simulation.
 *
 * The beam reconstruction is ported from Timothy Lottes' public-domain CRT
 * shader (Shadertoy "FixingPixelArt" / libretro crt-lottes), with the
 * luminance-dependent beam width taken from cgwg's crt-geom.
 *
 * The essential idea: do NOT treat scanlines as a texture-space grating like
 * `sin(uv.y * resolution.y)`. That beats against the physical pixel grid and
 * shimmers. Instead, work in EMULATED pixel space — measure the distance from
 * each output fragment to the nearest emulated scanline centre, and evaluate a
 * Gaussian beam profile at that distance. The scanline pattern then follows the
 * image through barrel distortion instead of sliding across it.
 *
 * The other half of authenticity is beam blooming: a real electron beam widens
 * as it gets brighter, so bright text fills the gaps between scanlines while
 * dark areas keep them wide open. Fixed-width scanlines are the single most
 * common reason a CRT shader reads as a cheap overlay.
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
precision highp float;

varying vec2 v_texCoord;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_sourceSize;

uniform float u_scanlineIntensity;
uniform float u_bloomStrength;
uniform float u_curvatureAmount;
uniform float u_flickerRate;
uniform float u_noiseIntensity;
uniform float u_vignetteStrength;
uniform float u_brightness;
uniform float u_jitterIntensity;
uniform float u_phosphorMaskIntensity;
uniform float u_cornerPinch;
uniform float u_burnInStrength;
uniform float u_sourceOpacity;

uniform float u_hardScan;
uniform float u_hardPix;
uniform float u_beamMinWidth;
uniform float u_beamMaxWidth;
uniform float u_beamPower;
uniform float u_maskPitch;
uniform float u_maskDark;
uniform float u_maskLight;
uniform float u_bloomThreshold;
uniform float u_bloomKnee;
uniform float u_crtGamma;
uniform float u_monitorGamma;

uniform sampler2D u_sourceTexture;
uniform sampler2D u_noiseTexture;
uniform sampler2D u_bloomTexture;
uniform sampler2D u_burnInTexture;

// ── Gamma ───────────────────────────────────────────────────
// All beam/mask/bloom math must happen in linear light. Blending phosphor
// contributions in gamma space is what makes naive CRT shaders look washed out.

vec3 toLinear(vec3 c) {
  return pow(max(c, vec3(0.0)), vec3(u_crtGamma));
}

vec3 toGamma(vec3 c) {
  return pow(max(c, vec3(0.0)), vec3(1.0 / u_monitorGamma));
}

float luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

// ── Hash / Noise ────────────────────────────────────────────

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// ── Geometry ────────────────────────────────────────────────

vec2 warp(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  // Lottes-style warp: each axis bulges as a function of the other.
  centered *= vec2(
    1.0 + (centered.y * centered.y) * u_curvatureAmount,
    1.0 + (centered.x * centered.x) * u_curvatureAmount
  );
  // Corner pinch tightens the diagonals without deepening the barrel.
  float corner = abs(centered.x * centered.y);
  centered *= 1.0 + corner * u_cornerPinch;
  return centered * 0.5 + 0.5;
}

// ── Beam Reconstruction ─────────────────────────────────────

// Signed distance from 'pos' to the nearest emulated texel centre,
// measured in emulated pixels.
vec2 dist(vec2 pos) {
  vec2 p = pos * u_sourceSize;
  return -((p - floor(p)) - vec2(0.5));
}

vec3 fetch(vec2 pos, vec2 off) {
  pos = floor(pos * u_sourceSize + off) / u_sourceSize;
  if (max(abs(pos.x - 0.5), abs(pos.y - 0.5)) > 0.5) {
    return vec3(0.0);
  }
  return toLinear(texture2D(u_sourceTexture, pos).rgb);
}

float gaus(float pos, float scale) {
  return exp2(scale * pos * pos);
}

// Beam width grows with luminance — this is the blooming that lets bright
// glyphs fill the scanline gaps while dark areas stay banded.
float beamScale(float lum) {
  float width = mix(
    u_beamMinWidth,
    u_beamMaxWidth,
    pow(clamp(lum, 0.0, 1.0), 1.0 / max(u_beamPower, 0.001))
  );
  return u_hardScan / max(width * width, 0.0001);
}

// 3-tap horizontal reconstruction on one scanline.
vec3 horz3(vec2 pos, float off) {
  vec3 b = fetch(pos, vec2(-1.0, off));
  vec3 c = fetch(pos, vec2( 0.0, off));
  vec3 d = fetch(pos, vec2( 1.0, off));
  float dst = dist(pos).x;
  float wb = gaus(dst - 1.0, u_hardPix);
  float wc = gaus(dst + 0.0, u_hardPix);
  float wd = gaus(dst + 1.0, u_hardPix);
  return (b * wb + c * wc + d * wd) / (wb + wc + wd);
}

// 5-tap horizontal reconstruction, used on the dominant scanline.
vec3 horz5(vec2 pos, float off) {
  vec3 a = fetch(pos, vec2(-2.0, off));
  vec3 b = fetch(pos, vec2(-1.0, off));
  vec3 c = fetch(pos, vec2( 0.0, off));
  vec3 d = fetch(pos, vec2( 1.0, off));
  vec3 e = fetch(pos, vec2( 2.0, off));
  float dst = dist(pos).x;
  float wa = gaus(dst - 2.0, u_hardPix);
  float wb = gaus(dst - 1.0, u_hardPix);
  float wc = gaus(dst + 0.0, u_hardPix);
  float wd = gaus(dst + 1.0, u_hardPix);
  float we = gaus(dst + 2.0, u_hardPix);
  return (a * wa + b * wb + c * wc + d * wd + e * we) / (wa + wb + wc + wd + we);
}

// Weight of the scanline 'off' rows away, using a luminance-widened beam.
float scanWeight(vec2 pos, float off, float lum) {
  float dst = dist(pos).y;
  return gaus(dst + off, beamScale(lum));
}

// Blend the three scanlines that can illuminate this fragment.
vec3 tri(vec2 pos) {
  vec3 a = horz3(pos, -1.0);
  vec3 b = horz5(pos,  0.0);
  vec3 c = horz3(pos,  1.0);

  float wa = scanWeight(pos, -1.0, luma(a));
  float wb = scanWeight(pos,  0.0, luma(b));
  float wc = scanWeight(pos,  1.0, luma(c));

  vec3 beam = a * wa + b * wb + c * wc;

  // Scanline depth is the contrast between beam peak and the gaps. At
  // intensity 0 the reconstruction is normalised back to a flat image.
  float sum = wa + wb + wc;
  vec3 flat_ = beam / max(sum, 0.0001);
  return mix(flat_, beam, u_scanlineIntensity);
}

// ── Aperture Grille ─────────────────────────────────────────
// Locked to gl_FragCoord, NOT to uv: the mask belongs to the physical
// display's pixel columns. Deriving it from warped uv makes it moire.

vec3 apertureGrille(vec2 fragCoord) {
  vec3 mask = vec3(u_maskDark);
  float cell = fract(fragCoord.x * (1.0 / max(u_maskPitch, 1.0)));
  if (cell < 0.333) {
    mask.r = u_maskLight;
  } else if (cell < 0.666) {
    mask.g = u_maskLight;
  } else {
    mask.b = u_maskLight;
  }
  return mix(vec3(1.0), mask, u_phosphorMaskIntensity);
}

// ── Main ────────────────────────────────────────────────────

void main() {
  vec2 uv = v_texCoord;

  // Analog jitter, applied before geometry so it moves the whole raster.
  float jx = (hash(vec2(floor(u_time * 30.0), 0.0)) - 0.5) * u_jitterIntensity;
  float jy = (hash(vec2(0.0, floor(u_time * 30.0))) - 0.5) * u_jitterIntensity * 0.5;
  uv += vec2(jx, jy);

  vec2 pos = warp(uv);

  // Outside the tube: black bezel interior, no content.
  if (max(abs(pos.x - 0.5), abs(pos.y - 0.5)) > 0.5) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  vec3 color = tri(pos);

  // Phosphor persistence, already linear from the accumulation pass.
  vec3 burnIn = texture2D(u_burnInTexture, pos).rgb * u_burnInStrength;
  color += burnIn;

  // Thresholded bloom: only genuinely bright phosphors halate. Blurring and
  // re-adding the whole frame is what destroys contrast.
  vec3 bloomSample = toLinear(texture2D(u_bloomTexture, pos).rgb);
  float bl = luma(bloomSample);
  float excess = max(bl - u_bloomThreshold, 0.0);
  float soft = excess * excess / (excess + max(u_bloomKnee, 0.0001));
  color += bloomSample * soft * u_bloomStrength;

  // Aperture grille on the physical pixel grid.
  color *= apertureGrille(gl_FragCoord.xy);

  // Mains-hum flicker.
  float flicker = 1.0 + (hash(vec2(floor(u_time * 60.0), 1.0)) - 0.5) * u_flickerRate;
  color *= flicker;

  // Vignette, using the warped radius so it follows the tube.
  vec2 centered = pos - 0.5;
  float r = length(centered);
  color *= mix(1.0, smoothstep(0.85, 0.25, r), u_vignetteStrength);

  color *= u_brightness;

  // Signal grain, added in linear light before the display transfer.
  vec3 grain = texture2D(u_noiseTexture, uv * 2.0 + fract(u_time)).rgb;
  color += (grain - 0.5) * u_noiseIntensity;

  color *= u_sourceOpacity;

  gl_FragColor = vec4(toGamma(clamp(color, 0.0, 1.0)), 1.0);
}
`;
