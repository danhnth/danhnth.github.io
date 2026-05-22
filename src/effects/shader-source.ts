/**
 * GLSL shader source code for CRT terminal effects.
 * All shaders use mediump precision for mobile compatibility.
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

export const fragmentShaderScanlines = `
precision mediump float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_scanlineIntensity;

void main() {
  float scanline = sin(v_texCoord.y * u_resolution.y * 3.14159) * 0.5 + 0.5;
  scanline = pow(scanline, 0.5);
  float intensity = 1.0 - (u_scanlineIntensity * scanline);
  gl_FragColor = vec4(vec3(intensity), 1.0);
}
`;

export const fragmentShaderBloom = `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_texture;
uniform float u_bloomStrength;
uniform vec2 u_resolution;

void main() {
  vec4 color = texture2D(u_texture, v_texCoord);
  vec3 bloom = vec3(0.0);
  vec2 texel = 1.0 / u_resolution;

  // 3x3 Gaussian blur approximation
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      vec2 offset = vec2(float(x), float(y)) * texel * 2.0;
      bloom += texture2D(u_texture, v_texCoord + offset).rgb;
    }
  }
  bloom /= 9.0;

  // Only bloom bright areas
  float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  float bloomMask = smoothstep(0.4, 0.8, luminance);

  vec3 finalColor = color.rgb + (bloom * bloomMask * u_bloomStrength);
  gl_FragColor = vec4(finalColor, color.a);
}
`;

export const fragmentShaderDistortion = `
precision mediump float;
varying vec2 v_texCoord;
uniform float u_curvatureAmount;
uniform float u_time;

void main() {
  vec2 centered = v_texCoord - 0.5;
  float dist = length(centered);

  // Barrel distortion
  float distortion = 1.0 + u_curvatureAmount * dist * dist;
  vec2 distorted = centered * distortion + 0.5;

  // Chromatic aberration at edges
  float chromaticShift = u_curvatureAmount * 0.5;
  float aberration = chromaticShift * dist * dist;

  gl_FragColor = vec4(
    distorted.x + aberration,
    distorted.y,
    distorted.x - aberration,
    1.0
  );
}
`;

export const fragmentShaderComposite = `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_texture;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_scanlineIntensity;
uniform float u_bloomStrength;
uniform float u_curvatureAmount;
uniform float u_flickerRate;

// Random function for flicker
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = v_texCoord;
  vec2 centered = uv - 0.5;
  float dist = length(centered);

  // Barrel distortion
  float distortion = 1.0 + u_curvatureAmount * dist * dist;
  vec2 distortedUV = centered * distortion + 0.5;

  // Chromatic aberration
  float chromaticShift = u_curvatureAmount * 0.5;
  float aberration = chromaticShift * dist * dist;
  vec2 rUV = distortedUV + vec2(aberration, 0.0);
  vec2 gUV = distortedUV;
  vec2 bUV = distortedUV - vec2(aberration, 0.0);

  // Clamp UVs to prevent sampling outside texture
  rUV = clamp(rUV, 0.0, 1.0);
  gUV = clamp(gUV, 0.0, 1.0);
  bUV = clamp(bUV, 0.0, 1.0);

  float r = texture2D(u_texture, rUV).r;
  float g = texture2D(u_texture, gUV).g;
  float b = texture2D(u_texture, bUV).b;
  vec3 color = vec3(r, g, b);

  // Bloom (simplified 3x3 blur)
  vec3 bloom = vec3(0.0);
  vec2 texel = 1.0 / u_resolution;
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      vec2 offset = vec2(float(x), float(y)) * texel * 3.0;
      bloom += texture2D(u_texture, clamp(distortedUV + offset, 0.0, 1.0)).rgb;
    }
  }
  bloom /= 9.0;
  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  float bloomMask = smoothstep(0.5, 0.9, luminance);
  color += bloom * bloomMask * u_bloomStrength;

  // Scanlines
  float scanline = sin(uv.y * u_resolution.y * 3.14159) * 0.5 + 0.5;
  scanline = pow(scanline, 0.4);
  color *= 1.0 - (u_scanlineIntensity * scanline);

  // Vignette
  float vignetteStrength = 0.8;
  float vignette = 1.0 - (dist * dist * vignetteStrength);
  vignette = clamp(vignette, 0.0, 1.0);
  color *= vignette;

  // Flicker
  float flicker = 1.0 + (random(vec2(u_time * 60.0, 0.0)) - 0.5) * u_flickerRate;
  color *= flicker;

  gl_FragColor = vec4(color, 1.0);
}
`;
