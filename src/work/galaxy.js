import * as THREE from 'three';

const WORLDS = [
  { code: '01', title: 'FLOAT & FRY', status: 'AVAILABLE', color: 0x9a63d8, emissive: 0x281139, radius: 2.05, position: [5.1, 0.2, 0], available: true },
  { code: '02', title: 'UNAVAILABLE', status: 'LOCKED', color: 0x242027, emissive: 0x09070b, radius: 1.3, position: [-6.2, 3.1, -4], available: false },
  { code: '03', title: 'UNAVAILABLE', status: 'LOCKED', color: 0x1e1a23, emissive: 0x070609, radius: 1.65, position: [8.4, -3.1, -10], available: false },
  { code: '04', title: 'UNAVAILABLE', status: 'LOCKED', color: 0x28232d, emissive: 0x0b080e, radius: 1.1, position: [-6.4, -3.8, -14], available: false },
];

function createStarField(count, radius, inner = 8) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < count; i += 1) {
    const distance = inner + Math.pow(Math.random(), 0.48) * (radius - inner);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const stride = i * 3;
    positions[stride] = distance * Math.sin(phi) * Math.cos(theta);
    positions[stride + 1] = distance * Math.cos(phi) * 0.72;
    positions[stride + 2] = distance * Math.sin(phi) * Math.sin(theta);
    color.setHSL(0.68 + Math.random() * 0.09, 0.18 + Math.random() * 0.35, 0.55 + Math.random() * 0.36);
    colors[stride] = color.r;
    colors[stride + 1] = color.g;
    colors[stride + 2] = color.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = createParticleMaterial(1.15, 0.72);
  return new THREE.Points(geometry, material);
}

function createParticleMaterial(size, opacity) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    uniforms: { uSize: { value: size }, uOpacity: { value: opacity } },
    vertexShader: `
      varying vec3 vColor;
      uniform float uSize;
      void main(){
        vColor=color;
        vec4 mv=modelViewMatrix*vec4(position,1.);
        gl_PointSize=uSize;
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: `
      varying vec3 vColor;
      uniform float uOpacity;
      void main(){
        float d=length(gl_PointCoord-.5);
        float alpha=smoothstep(.5,.12,d)*uOpacity;
        if(alpha<.01) discard;
        gl_FragColor=vec4(vColor,alpha);
      }`,
  });
}

function createGalaxyDust(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < count; i += 1) {
    const arm = i % 3;
    const radius = 2 + Math.pow(Math.random(), 0.64) * 24;
    const angle = radius * 0.32 + arm * (Math.PI * 2 / 3) + (Math.random() - 0.5) * 0.7;
    const stride = i * 3;
    positions[stride] = Math.cos(angle) * radius;
    positions[stride + 1] = (Math.random() - 0.5) * (0.25 + radius * 0.075);
    positions[stride + 2] = Math.sin(angle) * radius * 0.68;
    color.set(Math.random() > 0.76 ? 0x9561c5 : 0x473151);
    colors[stride] = color.r;
    colors[stride + 1] = color.g;
    colors[stride + 2] = color.b;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = createParticleMaterial(1.45, 0.42);
  const dust = new THREE.Points(geometry, material);
  dust.rotation.x = -0.14;
  return dust;
}

function createCore() {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime;
      void main(){
        vec2 p=vUv-.5; float d=length(p); float pulse=.96+sin(uTime*.8)*.025;
        float inner=smoothstep(.22,.0,d); float halo=smoothstep(.5,.08,d)*.36;
        float edge=smoothstep(.33,.1,d)*smoothstep(.05,.16,d);
        vec3 colour=vec3(.18,.055,.29)*halo+vec3(.48,.18,.72)*edge*.52*pulse+vec3(.8,.68,.92)*inner*.16;
        gl_FragColor=vec4(colour,max(inner*.35,halo));
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), material);
  mesh.position.set(0, 0, -5);
  return mesh;
}

function makeOrbit(radius, opacity = 0.16) {
  const points = [];
  for (let i = 0; i <= 128; i += 1) {
    const angle = (i / 128) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius * 0.66));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0x7d5b91, transparent: true, opacity, depthWrite: false });
  const line = new THREE.Line(geometry, material);
  line.rotation.x = -0.12;
  return line;
}

export function createGalaxyPortfolio(root) {
  root.innerHTML = `
    <canvas class="work-canvas" aria-hidden="true"></canvas>
    <div class="work-vignette" aria-hidden="true"></div>
    <header class="work-topbar"><span>DOME / WORK ARCHIVE</span><span class="work-topbar__status"><i></i> SYSTEM ONLINE</span></header>
    <section class="work-intro" aria-labelledby="work-heading">
      <p class="work-kicker">SELECTED WORKS · 2026</p>
      <h1 id="work-heading">ผลงานของผม</h1>
      <p class="work-lead">จักรวาลที่รวบรวมงานออกแบบ การทดลอง และประสบการณ์ดิจิทัลที่ผมตั้งใจสร้างขึ้น</p>
      <p class="work-instruction">DRAG TO EXPLORE <span>·</span> SCROLL TO ZOOM <span>·</span> SELECT A WORLD</p>
    </section>
    <div class="work-reticle" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <div class="work-world-labels"></div>
    <div class="work-unavailable" role="status" aria-live="polite">THIS WORLD IS UNAVAILABLE</div>
    <aside class="work-project" aria-hidden="true">
      <button class="work-project__close" type="button" aria-label="Close project">RETURN TO ORBIT <span>×</span></button>
      <div class="work-project__meta"><span>PROJECT 01</span><span>2026</span></div>
      <h2>FLOAT<br>&amp; FRY</h2>
      <p class="work-project__role">INTERACTIVE BRAND EXPERIENCE</p>
      <p class="work-project__copy">โปรเจกต์เว็บไซต์เชิงทดลองที่เปลี่ยนภาพลักษณ์ของแบรนด์ให้กลายเป็นประสบการณ์แบบ interactive ตั้งแต่การค้นหา visual language ไปจนถึงผลงาน final ที่ใช้งานได้จริง</p>
      <div class="work-project__media">
        <img src="/assets/journey/final1.png" alt="Float and Fry project — desktop screen" />
        <img src="/assets/journey/final2.png" alt="Float and Fry project — game screen" />
      </div>
      <div class="work-project__tags"><span>ART DIRECTION</span><span>WEBGL</span><span>INTERACTION</span></div>
    </aside>
    <footer class="work-footer"><span>01 / 04 WORLDS</span><span>ONLY PROJECT 01 IS CURRENTLY OPEN</span></footer>`;

  const canvas = root.querySelector('.work-canvas');
  const labelsRoot = root.querySelector('.work-world-labels');
  const projectPanel = root.querySelector('.work-project');
  const projectClose = root.querySelector('.work-project__close');
  const unavailable = root.querySelector('.work-unavailable');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.setClearColor(0x0e0e0e, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.88;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0e0e0e, 0.022);
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 160);
  camera.position.set(0, 3.2, 27);
  const universe = new THREE.Group();
  universe.rotation.set(-0.04, -0.08, 0);
  scene.add(universe);
  scene.add(new THREE.AmbientLight(0x33263b, 1.25));
  const key = new THREE.PointLight(0xb276e5, 52, 42, 1.7);
  key.position.set(0, 1, 2);
  scene.add(key);

  const stars = createStarField(innerWidth < 700 ? 1800 : 3400, 70);
  const dust = createGalaxyDust(innerWidth < 700 ? 2100 : 4400);
  const core = createCore();
  universe.add(stars, dust, core, makeOrbit(8.4), makeOrbit(14.6, 0.1), makeOrbit(21.5, 0.07));
  const sphereGeometry = new THREE.SphereGeometry(1, innerWidth < 700 ? 40 : 64, innerWidth < 700 ? 24 : 40);
  const planetMeshes = [];
  const labelButtons = [];
  const tempVector = new THREE.Vector3();

  WORLDS.forEach((world, index) => {
    const group = new THREE.Group();
    group.position.fromArray(world.position);
    const material = new THREE.MeshStandardMaterial({ color: world.color, emissive: world.emissive, emissiveIntensity: world.available ? 0.72 : 0.28, roughness: world.available ? 0.56 : 0.88, metalness: world.available ? 0.18 : 0.05 });
    const mesh = new THREE.Mesh(sphereGeometry, material);
    mesh.scale.setScalar(world.radius);
    mesh.rotation.z = 0.18 + index * 0.13;
    group.add(mesh);
    const atmosphere = new THREE.Mesh(sphereGeometry, new THREE.MeshBasicMaterial({ color: world.available ? 0x9d5bd4 : 0x3a303f, transparent: true, opacity: world.available ? 0.095 : 0.025, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    atmosphere.scale.setScalar(world.radius * 1.1);
    group.add(atmosphere);
    if (world.available) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(world.radius * 1.35, world.radius * 1.42, 128), new THREE.MeshBasicMaterial({ color: 0xb487d0, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = Math.PI * 0.43;
      ring.rotation.y = 0.26;
      group.add(ring);
    }
    universe.add(group);
    planetMeshes.push({ group, mesh, atmosphere, baseY: world.position[1] });

    const label = document.createElement('button');
    label.type = 'button';
    label.className = `work-world-label${world.available ? ' is-available' : ' is-locked'}`;
    label.innerHTML = `<b>${world.code}</b><span>${world.title}</span><small>${world.status}</small>`;
    label.setAttribute('aria-label', world.available ? `Open project ${world.title}` : `Project ${world.code} unavailable`);
    label.addEventListener('click', () => world.available ? openProject() : showUnavailable());
    labelsRoot.appendChild(label);
    labelButtons.push(label);
  });

  let active = false;
  let destroyed = false;
  let rafId = 0;
  let lastTime = performance.now();
  let yaw = -0.08;
  let pitch = -0.04;
  let targetYaw = yaw;
  let targetPitch = pitch;
  let targetZoom = 27;
  let pointerX = 0;
  let pointerY = 0;
  let dragX = 0;
  let dragY = 0;
  let dragging = false;
  let unavailableTimer = 0;

  function resize() {
    const width = root.clientWidth || innerWidth;
    const height = root.clientHeight || innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width < 700 ? 58 : 48;
    camera.updateProjectionMatrix();
  }

  function openProject() {
    if (!active) return;
    root.classList.add('project-open');
    projectPanel.setAttribute('aria-hidden', 'false');
    targetYaw = 0.68;
    targetPitch = -0.02;
    targetZoom = innerWidth < 700 ? 25 : 21;
  }

  function closeProject() {
    root.classList.remove('project-open');
    projectPanel.setAttribute('aria-hidden', 'true');
    targetYaw = -0.08;
    targetPitch = -0.04;
    targetZoom = 27;
  }

  function showUnavailable() {
    if (!active) return;
    unavailable.classList.remove('is-visible');
    void unavailable.offsetWidth;
    unavailable.classList.add('is-visible');
    clearTimeout(unavailableTimer);
    unavailableTimer = setTimeout(() => unavailable.classList.remove('is-visible'), 1500);
  }

  function updateLabels() {
    planetMeshes.forEach(({ group }, index) => {
      group.getWorldPosition(tempVector);
      tempVector.project(camera);
      const visible = tempVector.z < 1 && Math.abs(tempVector.x) < 1.15 && Math.abs(tempVector.y) < 1.15;
      const x = (tempVector.x * 0.5 + 0.5) * root.clientWidth;
      const y = (-tempVector.y * 0.5 + 0.5) * root.clientHeight;
      const label = labelButtons[index];
      label.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      label.style.opacity = visible ? '1' : '0';
      label.style.pointerEvents = visible && active ? 'auto' : 'none';
    });
  }

  function tick(now) {
    if (destroyed || !active) return;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    const time = now * 0.001;
    const smoothing = 1 - Math.exp(-dt * 4.5);
    yaw += (targetYaw - yaw) * smoothing;
    pitch += (targetPitch - pitch) * smoothing;
    universe.rotation.y = yaw;
    universe.rotation.x = pitch;
    camera.position.z += (targetZoom - camera.position.z) * smoothing;
    camera.position.x += ((pointerX * 0.42) - camera.position.x) * (smoothing * 0.34);
    camera.position.y += ((3.2 + pointerY * 0.28) - camera.position.y) * (smoothing * 0.34);
    camera.lookAt(0, 0, -4);
    if (!reduceMotion.matches) {
      stars.rotation.y += dt * 0.003;
      dust.rotation.y -= dt * 0.008;
      core.material.uniforms.uTime.value = time;
      planetMeshes.forEach(({ group, mesh, atmosphere, baseY }, index) => {
        mesh.rotation.y += dt * (0.07 + index * 0.015);
        atmosphere.rotation.y -= dt * 0.025;
        group.position.y = baseY + Math.sin(time * 0.45 + index * 1.7) * 0.12;
      });
    }
    updateLabels();
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  }

  function onPointerDown(event) {
    if (!active || root.classList.contains('project-open')) return;
    dragging = true;
    dragX = event.clientX;
    dragY = event.clientY;
    root.classList.add('is-dragging');
    canvas.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    const rect = root.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerY = -(((event.clientY - rect.top) / rect.height - 0.5) * 2);
    if (!dragging) return;
    const dx = event.clientX - dragX;
    const dy = event.clientY - dragY;
    targetYaw += dx * 0.0042;
    targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.0025, -0.32, 0.22);
    dragX = event.clientX;
    dragY = event.clientY;
  }

  function onPointerUp(event) {
    dragging = false;
    root.classList.remove('is-dragging');
    canvas.releasePointerCapture?.(event.pointerId);
  }

  function onWheel(event) {
    if (!active) return;
    event.preventDefault();
    targetZoom = THREE.MathUtils.clamp(targetZoom + event.deltaY * 0.008, 20, 34);
  }

  function onKeyDown(event) {
    if (!active) return;
    if (event.key === 'Escape') closeProject();
    if (event.key === '1' && !root.classList.contains('project-open')) openProject();
  }

  projectClose.addEventListener('click', closeProject);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', resize);
  resize();
  renderer.render(scene, camera);

  function start() {
    if (active || destroyed) return;
    active = true;
    lastTime = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  function destroy() {
    destroyed = true;
    active = false;
    cancelAnimationFrame(rafId);
    clearTimeout(unavailableTimer);
    projectClose.removeEventListener('click', closeProject);
    canvas.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('wheel', onWheel);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', resize);
    scene.traverse((object) => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else object.material?.dispose?.();
    });
    renderer.dispose();
    root.replaceChildren();
  }

  return { start, destroy, openProject, closeProject };
}
