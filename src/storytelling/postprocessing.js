import * as THREE from 'three';

const postVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const postFragmentShader = `
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform float uChromatic;
uniform float uGrain;
uniform float uFisheye;
uniform vec2 uResolution;
uniform float uTime;

// High-speed pseudo-random for analog grain
float random(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;

  // Micro-fisheye barrel distortion
  if (uFisheye > 0.001) {
    vec2 d = uv - vec2(0.5);
    float r = dot(d, d);
    uv = uv + d * (r * uFisheye);
  }

  // Chromatic aberration (RGB shift)
  vec4 color;
  if (uChromatic > 0.0005) {
    vec2 dir = uv - vec2(0.5);
    float dist = length(dir);
    vec2 offset = normalize(dir) * dist * uChromatic;
    float r = texture2D(tDiffuse, uv + offset).r;
    float g = texture2D(tDiffuse, uv).g;
    float b = texture2D(tDiffuse, uv - offset).b;
    color = vec4(r, g, b, 1.0);
  } else {
    color = texture2D(tDiffuse, uv);
  }

  // Analog film grain
  if (uGrain > 0.001) {
    float noise = (random(uv + fract(uTime * 10.0)) - 0.5) * uGrain;
    color.rgb += noise;
  }

  gl_FragColor = color;
}
`;

export function createPostProcessing(renderer, width, height) {
  const renderTarget = new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false,
    depthBuffer: true
  });

  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postScene = new THREE.Scene();

  const uniforms = {
    tDiffuse: { value: renderTarget.texture },
    uChromatic: { value: 0.0 },
    uGrain: { value: 0.028 },
    uFisheye: { value: 0.0 },
    uResolution: { value: new THREE.Vector2(width, height) },
    uTime: { value: 0.0 }
  };

  const postMaterial = new THREE.ShaderMaterial({
    vertexShader: postVertexShader,
    fragmentShader: postFragmentShader,
    uniforms,
    depthWrite: false,
    depthTest: false
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMaterial);
  postScene.add(quad);

  function resize(newWidth, newHeight) {
    renderTarget.setSize(newWidth, newHeight);
    uniforms.uResolution.value.set(newWidth, newHeight);
  }

  function render(scene, camera, time, options = {}) {
    uniforms.uTime.value = time;
    uniforms.uChromatic.value = options.chromatic ?? 0.0;
    uniforms.uFisheye.value = options.fisheye ?? 0.0;
    uniforms.uGrain.value = options.grain ?? 0.028;

    // 1. Render primary 3D scene to internal render target
    renderer.setRenderTarget(renderTarget);
    renderer.clear();
    renderer.render(scene, camera);

    // 2. Render post-processing quad to screen
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCamera);
  }

  function dispose() {
    renderTarget.dispose();
    postMaterial.dispose();
  }

  return {
    renderTarget,
    uniforms,
    resize,
    render,
    dispose
  };
}
