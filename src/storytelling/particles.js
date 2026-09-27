import * as THREE from 'three';

/**
 * Memory Fragment System (Visual DNA)
 * Extracts visual identity from fail1-4.
 * Fully GPU-accelerated vertex simulation:
 * - Zero CPU array looping & zero every-frame buffer re-uploads
 * - Smooth continuous phase transitions
 * - Optimized fragment shader with zero discard stalls and soft falloff
 */
export function createMemoryFragmentSystem(options = {}) {
  const count = options.count || 380;

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  // Custom static GPU attributes
  const aOrigin = new Float32Array(count * 3);
  const aDrift = new Float32Array(count * 3);
  const aTarget1 = new Float32Array(count * 3);
  const aTarget2 = new Float32Array(count * 3);
  const aPhase = new Float32Array(count);
  const aRadius = new Float32Array(count);
  const aDepthOffset = new Float32Array(count);
  const aTargetChoice = new Float32Array(count);

  // Memory anchor points aligned with 600-unit corridor
  const failOrigins = [
    new THREE.Vector3(0, 0.4, -48),     // fail1
    new THREE.Vector3(-4.0, 0.0, -196), // fail2
    new THREE.Vector3(6.0, 1.2, -270),  // fail3
    new THREE.Vector3(0, 0, -350)       // fail4
  ];

  // Visual DNA color palettes sampled from fail1-4
  const palette = [
    new THREE.Color('#B8B8B8'), // Metallic light
    new THREE.Color('#69358A'), // Core purple residual
    new THREE.Color('#351648'), // Deep purple
    new THREE.Color('#F1EFEA'), // White spark
    new THREE.Color('#2A3A4A'), // Cold slate
    new THREE.Color('#4A2A3A')  // Warm dark
  ];

  // Final targets in space
  const final1Pos = new THREE.Vector3(-6.5, 0.8, -540);
  const final2Pos = new THREE.Vector3(6.5, -0.6, -555);

  for (let i = 0; i < count; i++) {
    const sourceID = i % 4;
    const origin = failOrigins[sourceID];

    // Origin around source memory
    const ox = origin.x + (Math.random() - 0.5) * 16;
    const oy = origin.y + (Math.random() - 0.5) * 10;
    const oz = origin.z + (Math.random() - 0.5) * 12;

    positions[i * 3 + 0] = ox;
    positions[i * 3 + 1] = oy;
    positions[i * 3 + 2] = oz;

    aOrigin[i * 3 + 0] = ox;
    aOrigin[i * 3 + 1] = oy;
    aOrigin[i * 3 + 2] = oz;

    // Drift vector (Phase 1 loss)
    aDrift[i * 3 + 0] = (Math.random() - 0.5) * 18;
    aDrift[i * 3 + 1] = (Math.random() - 0.5) * 12;
    aDrift[i * 3 + 2] = (Math.random() - 0.5) * 20;

    // Target positions forming the perimeter of final1 & final2
    const theta1 = Math.random() * Math.PI * 2;
    const r1x = Math.cos(theta1) * 7.5;
    const r1y = Math.sin(theta1) * 4.5;
    aTarget1[i * 3 + 0] = final1Pos.x + r1x;
    aTarget1[i * 3 + 1] = final1Pos.y + r1y;
    aTarget1[i * 3 + 2] = final1Pos.z + (Math.random() - 0.5) * 1.5;

    const theta2 = Math.random() * Math.PI * 2;
    const r2x = Math.cos(theta2) * 7.5;
    const r2y = Math.sin(theta2) * 4.5;
    aTarget2[i * 3 + 0] = final2Pos.x + r2x;
    aTarget2[i * 3 + 1] = final2Pos.y + r2y;
    aTarget2[i * 3 + 2] = final2Pos.z + (Math.random() - 0.5) * 1.5;

    // GPU dynamics parameters
    aPhase[i] = i * 0.45 + Math.random() * 2.0;
    aRadius[i] = 4.5 + (i % 7) * 0.75;
    aDepthOffset[i] = (i % 24) * 0.8;
    aTargetChoice[i] = (i % 2 === 0) ? 0.0 : 1.0;

    const col = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3 + 0] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;

    sizes[i] = 2.0 + Math.random() * 2.8;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  geometry.setAttribute('aOrigin', new THREE.BufferAttribute(aOrigin, 3));
  geometry.setAttribute('aDrift', new THREE.BufferAttribute(aDrift, 3));
  geometry.setAttribute('aTarget1', new THREE.BufferAttribute(aTarget1, 3));
  geometry.setAttribute('aTarget2', new THREE.BufferAttribute(aTarget2, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
  geometry.setAttribute('aRadius', new THREE.BufferAttribute(aRadius, 1));
  geometry.setAttribute('aDepthOffset', new THREE.BufferAttribute(aDepthOffset, 1));
  geometry.setAttribute('aTargetChoice', new THREE.BufferAttribute(aTargetChoice, 1));

  // Particle Material
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uCameraPos: { value: new THREE.Vector3() },
      uOpacity: { value: 0.75 }
    },
    vertexColors: true,
    vertexShader: `
      attribute float size;
      attribute vec3 aOrigin;
      attribute vec3 aDrift;
      attribute vec3 aTarget1;
      attribute vec3 aTarget2;
      attribute float aPhase;
      attribute float aRadius;
      attribute float aDepthOffset;
      attribute float aTargetChoice;

      varying vec3 vColor;

      uniform float uTime;
      uniform float uProgress;
      uniform vec3 uCameraPos;

      void main() {
        vColor = color;

        vec3 pos = aOrigin;

        // Continuous GPU choreography based on camera journey progress
        if (uProgress < 0.56) {
          // Phase 1: Drifting away into darkness
          float driftFactor = clamp(uProgress * 2.0, 0.0, 1.0);
          pos = aOrigin + aDrift * driftFactor;
        } else if (uProgress < 0.68) {
          // Phase 2A: Turning point - smooth pull into vortex orbit
          float t = (uProgress - 0.56) / 0.12;
          vec3 p1 = aOrigin + aDrift;
          float angle = uTime * 0.9 + aPhase;
          vec3 orbit = vec3(
            uCameraPos.x + cos(angle) * aRadius,
            uCameraPos.y + sin(angle) * aRadius,
            uCameraPos.z - 14.0 - aDepthOffset
          );
          pos = mix(p1, orbit, smoothstep(0.0, 0.6, t));
        } else if (uProgress < 0.80) {
          // Phase 2B: Reconstruction - swarming vortex around camera forward vector
          float t = (uProgress - 0.68) / 0.12;
          float angle = uTime * 1.5 + aPhase * 0.3;
          float vortexR = aRadius * (1.0 - t * 0.45);
          pos = vec3(
            uCameraPos.x + cos(angle) * vortexR,
            uCameraPos.y + sin(angle) * vortexR,
            uCameraPos.z - 18.0 + aDepthOffset - 16.0
          );
        } else if (uProgress < 0.88) {
          // Phase 2C: Converging into final1 & final2
          float t = (uProgress - 0.80) / 0.08;
          if (aTargetChoice < 0.5) {
            vec3 startPt = vec3(uCameraPos.x, uCameraPos.y, uCameraPos.z - 18.0);
            pos = mix(startPt, aTarget1, smoothstep(0.0, 1.0, t));
          } else {
            float angle = uTime + aPhase;
            pos = vec3(uCameraPos.x + cos(angle) * 5.0, uCameraPos.y + sin(angle) * 5.0, uCameraPos.z - 28.0);
          }
        } else if (uProgress < 0.94) {
          // Phase 2D: Combining into final2
          float t = (uProgress - 0.88) / 0.06;
          pos = mix(aTarget1, aTarget2, smoothstep(0.0, 1.0, t));
        } else {
          // Phase 2E: Final dispersion toward completion horizon
          float t = (uProgress - 0.94) / 0.06;
          pos = vec3(
            aTarget2.x + aDrift.x * t * 0.5,
            aTarget2.y + aDrift.y * t * 0.5,
            aTarget2.z - t * 45.0
          );
        }

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        
        // Controlled point size: max 20px avoids fill-rate throttling
        gl_PointSize = size * (130.0 / -mvPosition.z);
        gl_PointSize = clamp(gl_PointSize, 1.5, 20.0);

        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      uniform float uOpacity;

      void main() {
        // Soft circular particle with NO discard penalty
        float dist = length(gl_PointCoord - vec2(0.5));
        float alpha = smoothstep(0.5, 0.06, dist) * uOpacity;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  /**
   * Ultra-lightweight GPU uniform update (0 CPU calculation, 0 buffer uploads)
   */
  function update(progress, time, cameraPos) {
    material.uniforms.uTime.value = time;
    material.uniforms.uProgress.value = progress;
    if (cameraPos) {
      material.uniforms.uCameraPos.value.copy(cameraPos);
    }
  }

  return { points, material, update };
}
