import * as THREE from 'three';
import { createMemoryArtifact, createFinalArtifact, createEclipseBody, createTrajectoryLine } from './objects.js';
import { createTextPlane, createIncompleteSuccessStructure } from './typography.js';
import { createMemoryFragmentSystem } from './particles.js';
import { createPostProcessing } from './postprocessing.js';

export async function createStorytellingScene(container) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  // 1. WebGL Renderer
  const renderer = new THREE.WebGLRenderer({
    powerPreference: 'high-performance',
    antialias: false,
    alpha: false,
    stencil: false,
    depth: true
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x0E0E0E, 1.0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.domElement.className = 'storytelling-canvas';
  container.appendChild(renderer.domElement);

  // 2. Scene & Camera
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0E0E0E');
  scene.fog = new THREE.FogExp2('#0E0E0E', 0.0035);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 800);
  camera.position.set(0, 0, 0);

  // 3. Lighting System
  const ambientLight = new THREE.AmbientLight('#160A20', 0.65);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight('#F1EFEA', 0.8);
  dirLight.position.set(5, 12, 10);
  scene.add(dirLight);

  const purpleRimLight = new THREE.PointLight('#69358A', 2.2, 80, 2);
  purpleRimLight.position.set(0, 5, -250);
  scene.add(purpleRimLight);

  const backlightTurn = new THREE.PointLight('#F1EFEA', 0, 60, 2);
  backlightTurn.position.set(0, 0, -412);
  scene.add(backlightTurn);

  // 4. Asset Texture Loading
  const textureLoader = new THREE.TextureLoader();
  const loadTexture = (url) => new Promise((resolve, reject) => {
    textureLoader.load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      resolve(tex);
    }, undefined, reject);
  });

  const [texFail1, texFail2, texFail3, texFail4, texFinal1, texFinal2] = await Promise.all([
    loadTexture('/assets/journey/fail1.png'),
    loadTexture('/assets/journey/fail2.png'),
    loadTexture('/assets/journey/fail3.png'),
    loadTexture('/assets/journey/fail4.png'),
    loadTexture('/assets/journey/final1.png'),
    loadTexture('/assets/journey/final2.png')
  ]);

  // 5. Memory Objects Placement
  // Scene 01: fail1 (Cave climber, 16:9)
  const artifactFail1 = createMemoryArtifact(texFail1, { width: 12, height: 6.75 });
  artifactFail1.position.set(0, 0.4, -48);
  scene.add(artifactFail1);

  // Scene 02 & 03: fail2 (Mobile pet room, portrait ~9:16)
  const artifactFail2 = createMemoryArtifact(texFail2, { width: 6.8, height: 12.0, isFail2: true });
  artifactFail2.position.set(-4.0, 0.0, -196);
  artifactFail2.rotation.y = 0.22;
  scene.add(artifactFail2);

  // Scene 04: fail3 (16:9, receding by real spatial distance)
  const artifactFail3 = createMemoryArtifact(texFail3, { width: 12, height: 6.75 });
  artifactFail3.position.set(6.0, 1.2, -270);
  artifactFail3.rotation.y = -0.3;
  scene.add(artifactFail3);

  // Scene 05: fail4 (16:9, high production artwork occluded by eclipse)
  const artifactFail4 = createMemoryArtifact(texFail4, { width: 14, height: 7.88 });
  artifactFail4.position.set(0, 0, -350);
  scene.add(artifactFail4);

  // Scene 05: Dark Celestial Eclipse Body
  const eclipse = createEclipseBody(7.5);
  eclipse.position.set(8.0, 0, -342);
  scene.add(eclipse);

  // Scene 08: final1 (Pristine 16:9)
  const artifactFinal1 = createFinalArtifact(texFinal1, { width: 14, height: 7.88 });
  artifactFinal1.position.set(-6.5, 0.8, -540);
  artifactFinal1.rotation.y = 0.2;
  artifactFinal1.visible = false;
  scene.add(artifactFinal1);

  // Scene 08: final2 (Pristine 16:9)
  const artifactFinal2 = createFinalArtifact(texFinal2, { width: 14, height: 7.88 });
  artifactFinal2.position.set(6.5, -0.6, -555);
  artifactFinal2.rotation.y = -0.22;
  artifactFinal2.visible = false;
  scene.add(artifactFinal2);

  // Scene 08: Luminous Trajectory Line
  const trajectoryLine = createTrajectoryLine();
  scene.add(trajectoryLine);

  // Preload primary Thai typeface to guarantee zero fallback metrics
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.load('400 90px "FC Mee Sakul"');
      await document.fonts.load('600 120px "FC Mee Sakul"');
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font load fallback:', e);
    }
  }

  // 6. Typography 3D Objects Placement
  // Scene 01: "ผมเคยสร้างอะไรไว้หลายอย่าง"
  const textScene01 = createTextPlane('ผมเคยสร้างอะไรไว้หลายอย่าง', {
    planeWidth: 14,
    planeHeight: 3.5,
    fontSize: 90
  });
  textScene01.position.set(0, -2.4, -44);
  textScene01.userData.baseY = -2.4;
  scene.add(textScene01);

  // Scene 02: "แต่ไม่มีอะไรที่ผมคิดว่า" & "ดีพอที่จะเรียกว่าสำเร็จ และภูมิใจ"
  const textScene02A = createTextPlane('แต่ไม่มีอะไรที่ผมคิดว่า', {
    planeWidth: 15,
    planeHeight: 3.2,
    fontSize: 92
  });
  textScene02A.position.set(1.5, 4.5, -118);
  textScene02A.userData.baseY = 4.5;
  scene.add(textScene02A);

  const textScene02B = createTextPlane('ดีพอที่จะเรียกว่าสำเร็จ และภูมิใจ', {
    planeWidth: 22,
    planeHeight: 4.8,
    fontSize: 105,
    fontWeight: '600'
  });
  textScene02B.position.set(0.0, 2.2, -128);
  textScene02B.userData.baseY = 2.2;
  scene.add(textScene02B);

  // Incomplete "สำเร็จ" Monumental Sculpture
  const structureSuccess = createIncompleteSuccessStructure();
  structureSuccess.position.set(-2.5, -1.0, -142);
  scene.add(structureSuccess);

  // Scene 03: "บางงานถูกทิ้ง"
  const textScene03 = createTextPlane('บางงานถูกทิ้ง', {
    planeWidth: 12,
    planeHeight: 3.2,
    fontSize: 105
  });
  textScene03.position.set(1.5, -2.0, -192);
  textScene03.userData.baseY = -2.0;
  scene.add(textScene03);

  // Scene 04: "บางงานถูกลืม"
  const textScene04 = createTextPlane('บางงานถูกลืม', {
    planeWidth: 12,
    planeHeight: 3.2,
    fontSize: 105
  });
  textScene04.position.set(-0.5, 0.5, -260);
  textScene04.userData.baseY = 0.5;
  scene.add(textScene04);

  // Scene 05: "บางงานไม่เคยมีใครเห็น"
  const textScene05 = createTextPlane('บางงานไม่เคยมีใครเห็น', {
    planeWidth: 16,
    planeHeight: 3.6,
    fontSize: 110
  });
  textScene05.position.set(0, 4.2, -338);
  textScene05.userData.baseY = 4.2;
  scene.add(textScene05);

  // Scene 06: Drifting Words "ถูกทิ้ง", "ถูกลืม", "ไม่มีใครเห็น"
  const driftWord1 = createTextPlane('ถูกทิ้ง', { planeWidth: 7, planeHeight: 2.2, fontSize: 80, color: '#B8B8B8' });
  driftWord1.position.set(-4.0, 2.2, -375);
  driftWord1.userData.baseY = 2.2;
  driftWord1.userData.baseZ = -375;
  scene.add(driftWord1);

  const driftWord2 = createTextPlane('ถูกลืม', { planeWidth: 7, planeHeight: 2.2, fontSize: 80, color: '#B8B8B8' });
  driftWord2.position.set(4.0, -1.8, -388);
  driftWord2.userData.baseY = -1.8;
  driftWord2.userData.baseZ = -388;
  scene.add(driftWord2);

  const driftWord3 = createTextPlane('ไม่มีใครเห็น', { planeWidth: 10, planeHeight: 2.5, fontSize: 80, color: '#B8B8B8' });
  driftWord3.position.set(-2.0, -2.8, -400);
  driftWord3.userData.baseY = -2.8;
  driftWord3.userData.baseZ = -400;
  scene.add(driftWord3);

  // Scene 06 Turning Point Hero Fly-Through: "แต่ผมยังทำต่อ"
  const textHeroTurn = createTextPlane('แต่ผมยังทำต่อ', {
    planeWidth: 20,
    planeHeight: 6.0,
    textureWidth: 2048,
    textureHeight: 512,
    fontSize: 135,
    fontWeight: '600'
  });
  textHeroTurn.position.set(0, 0, -422);
  textHeroTurn.userData.baseY = 0;
  scene.add(textHeroTurn);

  // Scene 07: "เพราะทุกชิ้นที่ล้มเหลว" & "กลายเป็นส่วนหนึ่งของสิ่งที่ทำได้ในวันนี้"
  const textScene07A = createTextPlane('เพราะทุกชิ้นที่ล้มเหลว', {
    planeWidth: 16,
    planeHeight: 3.8,
    fontSize: 105
  });
  textScene07A.position.set(0, 2.8, -475);
  textScene07A.userData.baseY = 2.8;
  scene.add(textScene07A);

  const textScene07B = createTextPlane('กลายเป็นส่วนหนึ่งของสิ่งที่ทำได้ในวันนี้', {
    planeWidth: 23,
    planeHeight: 4.8,
    textureWidth: 2560,
    textureHeight: 512,
    fontSize: 105,
    fontWeight: '600'
  });
  textScene07B.position.set(0, -1.8, -490);
  textScene07B.userData.baseY = -1.8;
  scene.add(textScene07B);

  // Scene 08: "ทุกความพยายามพาผมมาถึงตรงนี้"
  const textScene08 = createTextPlane('ทุกความพยายามพาผมมาถึงตรงนี้', {
    planeWidth: 26,
    planeHeight: 5.5,
    textureWidth: 2560,
    textureHeight: 512,
    fontSize: 115,
    fontWeight: '600'
  });
  textScene08.position.set(0, 4.0, -532);
  textScene08.userData.baseY = 4.0;
  scene.add(textScene08);

  // Scene 09 Final Grand Reveal: "นี่คือผลงานของผม"
  const textScene09Final = createTextPlane('นี่คือผลงานของผม', {
    planeWidth: 30,
    planeHeight: 8.0,
    textureWidth: 2048,
    textureHeight: 512,
    fontSize: 155,
    fontWeight: '600'
  });
  textScene09Final.position.set(0, 0, -600);
  textScene09Final.userData.baseY = 0;
  scene.add(textScene09Final);

  // 7. Memory Fragment Particle System
  const fragmentSystem = createMemoryFragmentSystem({ count: 380 });
  scene.add(fragmentSystem.points);

  // 8. Fullscreen Post-Processing
  const post = createPostProcessing(renderer, width * dpr, height * dpr);

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const newDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(newDpr);
    post.resize(w * newDpr, h * newDpr);
  }

  function dispose() {
    renderer.dispose();
    post.dispose();
    container.innerHTML = '';
  }

  return {
    scene,
    camera,
    renderer,
    ambientLight,
    dirLight,
    purpleRimLight,
    backlightTurn,
    post,
    fragmentSystem,
    trajectoryLine,
    eclipse,
    artifacts: {
      fail1: artifactFail1,
      fail2: artifactFail2,
      fail3: artifactFail3,
      fail4: artifactFail4,
      final1: artifactFinal1,
      final2: artifactFinal2
    },
    texts: {
      scene01: textScene01,
      scene02A: textScene02A,
      scene02B: textScene02B,
      structureSuccess,
      scene03: textScene03,
      scene04: textScene04,
      scene05: textScene05,
      drift1: driftWord1,
      drift2: driftWord2,
      drift3: driftWord3,
      heroTurn: textHeroTurn,
      scene07A: textScene07A,
      scene07B: textScene07B,
      scene08: textScene08,
      final: textScene09Final
    },
    resize,
    dispose
  };
}
