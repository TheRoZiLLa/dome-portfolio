import * as THREE from 'three';

const simplexNoiseGLSL = `
// 2D Simplex Noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

export function createMemoryMaterial(texture, options = {}) {
  const isFinal = !!options.isFinal;

  const uniforms = {
    uTexture: { value: texture },
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uDissolve: { value: 0 },
    uDamage: { value: isFinal ? 0.02 : 0.25 },
    uGlitch: { value: 0 },
    uChromatic: { value: isFinal ? 0.002 : 0.008 },
    uRimColor: { value: new THREE.Color(isFinal ? '#F1EFEA' : '#69358A') },
    uRimIntensity: { value: isFinal ? 0.85 : 0.5 },
    uOpacity: { value: 1.0 },
    uSignal: { value: 1.0 }, // 1.0 to 0.0 (Scene 04 signal fade)
    uDarkPurple: { value: new THREE.Color('#160A20') }
  };

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    uniform float uTime;
    uniform float uGlitch;
    uniform float uDamage;

    ${simplexNoiseGLSL}

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Subtle vertex noise
      if (uDamage > 0.05) {
        float n = snoise(pos.xy * 0.15 + uTime * 0.4);
        pos.z += n * uDamage * 0.25;
      }

      // Glitch displacement burst
      if (uGlitch > 0.05) {
        float tear = step(0.85, fract(sin(dot(uv.yy, vec2(12.9898, 78.233))) * 43758.5453));
        pos.x += tear * uGlitch * 0.4;
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      vViewPosition = -mvPosition.xyz;
      vNormal = normalMatrix * normal;
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uDissolve;
    uniform float uDamage;
    uniform float uGlitch;
    uniform float uChromatic;
    uniform vec3 uRimColor;
    uniform float uRimIntensity;
    uniform float uOpacity;
    uniform float uSignal;
    uniform vec3 uDarkPurple;

    ${simplexNoiseGLSL}

    void main() {
      vec2 uv = vUv;

      // Glitch UV horizontal split
      if (uGlitch > 0.05) {
        float lineNoise = snoise(vec2(uTime * 15.0, uv.y * 30.0));
        if (lineNoise > 0.4) {
          uv.x += (lineNoise - 0.4) * uGlitch * 0.08;
        }
      }

      // Procedural noise dissolve
      float noiseVal = (snoise(uv * 4.5 + uTime * 0.05) + 1.0) * 0.5;
      if (uDissolve > 0.001) {
        if (noiseVal < uDissolve) {
          discard;
        }
      }

      // Chromatic RGB separation
      vec4 color;
      if (uChromatic > 0.001) {
        float split = uChromatic + uGlitch * 0.015;
        float r = texture2D(uTexture, uv + vec2(split, 0.0)).r;
        float g = texture2D(uTexture, uv).g;
        float b = texture2D(uTexture, uv - vec2(split, 0.0)).b;
        float a = texture2D(uTexture, uv).a;
        color = vec4(r, g, b, a);
      } else {
        color = texture2D(uTexture, uv);
      }

      // Scanline degradation
      if (uDamage > 0.05) {
        float scanline = sin(uv.y * 500.0) * 0.06 * uDamage;
        color.rgb -= scanline;
      }

      // Subtle dissolve edge glowing border
      if (uDissolve > 0.001) {
        float edgeDist = noiseVal - uDissolve;
        if (edgeDist < 0.06) {
          float edgeFactor = 1.0 - (edgeDist / 0.06);
          color.rgb = mix(color.rgb, uRimColor * 2.0, edgeFactor);
        }
      }

      // Fresnel rim lighting
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
      vec3 rim = uRimColor * fresnel * uRimIntensity;

      // Residual purple energy tint
      color.rgb = mix(color.rgb, color.rgb + uDarkPurple * 0.4, 0.25);

      // Add rim
      color.rgb += rim;

      // Signal fade into void (#0E0E0E)
      vec3 voidColor = vec3(0.055, 0.055, 0.055); // #0E0E0E
      color.rgb = mix(voidColor, color.rgb, clamp(uSignal, 0.0, 1.0));

      gl_FragColor = vec4(color.rgb, color.a * uOpacity * clamp(uSignal * 1.5, 0.0, 1.0));
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: true
  });

  return material;
}
