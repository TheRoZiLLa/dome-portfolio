import * as THREE from 'three';
import { createMemoryMaterial } from './materials.js';
import { cameraSpline } from './splines.js';

/**
 * Creates a physical multi-layered Memory Artifact for failed works.
 * Contains: Image Plane, Glass Layer, Structural Frame, Rear Depth Backing, and Floating Shards.
 */
export function createMemoryArtifact(texture, options = {}) {
  const {
    width = 12,
    height = 7.5,
    isFail2 = false
  } = options;

  const group = new THREE.Group();

  // 1. Primary Image Layer with custom MemoryMaterial
  const imgMat = createMemoryMaterial(texture, { isFinal: false });
  const imgGeom = new THREE.PlaneGeometry(width, height, 16, 16);
  const imgMesh = new THREE.Mesh(imgGeom, imgMat);
  imgMesh.position.z = 0;
  group.add(imgMesh);

  // 2. Thin Glass Front Plate with subtle specular reflection
  const glassMat = new THREE.MeshBasicMaterial({
    color: '#69358A',
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide
  });
  const glassGeom = new THREE.PlaneGeometry(width * 1.02, height * 1.02);
  const glassMesh = new THREE.Mesh(glassGeom, glassMat);
  glassMesh.position.z = 0.08;
  group.add(glassMesh);

  // 3. Dark Structural Frame / Border
  const frameGeom = new THREE.BoxGeometry(width * 1.04, height * 1.04, 0.2, 4, 4, 1);
  const frameMat = new THREE.MeshBasicMaterial({
    color: '#21102D',
    wireframe: true,
    transparent: true,
    opacity: 0.45
  });
  const frameMesh = new THREE.Mesh(frameGeom, frameMat);
  frameMesh.position.z = -0.05;
  group.add(frameMesh);

  // 4. Rear Depth Plate
  const backMat = new THREE.MeshBasicMaterial({
    color: '#080808',
    side: THREE.DoubleSide
  });
  const backGeom = new THREE.PlaneGeometry(width * 0.98, height * 0.98);
  const backMesh = new THREE.Mesh(backGeom, backMat);
  backMesh.position.z = -0.15;
  group.add(backMesh);

  // 5. Detachable Structural Fragments for fail2 (Scene 03 Disassembly)
  const detachableShards = [];
  if (isFail2) {
    const shardGeom = new THREE.PlaneGeometry(0.8, 0.5);
    const shardMat = new THREE.MeshBasicMaterial({
      color: '#351648',
      wireframe: true,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 16; i++) {
      const shard = new THREE.Mesh(shardGeom, shardMat);
      // Place along the border edges
      const angle = (i / 16) * Math.PI * 2;
      shard.position.set(
        Math.cos(angle) * (width * 0.52),
        Math.sin(angle) * (height * 0.52),
        (Math.random() - 0.5) * 0.2
      );
      shard.userData = {
        basePos: shard.position.clone(),
        driftVel: new THREE.Vector3(
          Math.cos(angle) * (1.5 + Math.random() * 2),
          Math.sin(angle) * (1.5 + Math.random() * 2),
          (Math.random() - 0.5) * 3
        ),
        rotVel: new THREE.Vector3(Math.random() * 2, Math.random() * 2, Math.random() * 2)
      };
      group.add(shard);
      detachableShards.push(shard);
    }
  }

  group.userData = {
    imgMesh,
    imgMat,
    glassMesh,
    frameMesh,
    backMesh,
    detachableShards
  };

  return group;
}

/**
 * Creates a physical multi-layered Celestial Artifact for final works (final1, final2).
 * Stable, razor-sharp, shallow layered depth, white rim light, controlled Fresnel edge.
 */
export function createFinalArtifact(texture, options = {}) {
  const {
    width = 14,
    height = 8.5
  } = options;

  const group = new THREE.Group();

  // 1. Crisp Image Layer with MemoryMaterial (isFinal = true)
  const imgMat = createMemoryMaterial(texture, { isFinal: true });
  const imgGeom = new THREE.PlaneGeometry(width, height, 8, 8);
  const imgMesh = new THREE.Mesh(imgGeom, imgMat);
  group.add(imgMesh);

  // 2. Ultra-thin glass front with white/light purple reflection
  const glassMat = new THREE.MeshBasicMaterial({
    color: '#F1EFEA',
    transparent: true,
    opacity: 0.08,
    side: THREE.DoubleSide
  });
  const glassGeom = new THREE.PlaneGeometry(width * 1.01, height * 1.01);
  const glassMesh = new THREE.Mesh(glassGeom, glassMat);
  glassMesh.position.z = 0.05;
  group.add(glassMesh);

  // 3. Crisp Structural Edge Bevel
  const frameGeom = new THREE.BoxGeometry(width * 1.02, height * 1.02, 0.12);
  const frameMat = new THREE.MeshBasicMaterial({
    color: '#B8B8B8',
    wireframe: true,
    transparent: true,
    opacity: 0.35
  });
  const frameMesh = new THREE.Mesh(frameGeom, frameMat);
  frameMesh.position.z = -0.04;
  group.add(frameMesh);

  // 4. White Rim Halo Mesh (subtle backplate)
  const haloGeom = new THREE.PlaneGeometry(width * 1.05, height * 1.05);
  const haloMat = new THREE.MeshBasicMaterial({
    color: '#69358A',
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide
  });
  const haloMesh = new THREE.Mesh(haloGeom, haloMat);
  haloMesh.position.z = -0.12;
  group.add(haloMesh);

  group.userData = {
    imgMesh,
    imgMat,
    glassMesh,
    frameMesh,
    haloMesh
  };

  return group;
}

/**
 * Creates the massive dark celestial Eclipse Object for Scene 05.
 * Pure dark disk/sphere with a subtle purple rim glow.
 */
export function createEclipseBody(radius = 8.5) {
  const group = new THREE.Group();

  // Core dark disk
  const coreGeom = new THREE.CircleGeometry(radius, 64);
  const coreMat = new THREE.MeshBasicMaterial({
    color: '#020202',
    side: THREE.DoubleSide
  });
  const coreMesh = new THREE.Mesh(coreGeom, coreMat);
  group.add(coreMesh);

  // Outer glowing purple rim ring
  const rimGeom = new THREE.RingGeometry(radius * 0.98, radius * 1.05, 64);
  const rimMat = new THREE.MeshBasicMaterial({
    color: '#69358A',
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide
  });
  const rimMesh = new THREE.Mesh(rimGeom, rimMat);
  rimMesh.position.z = 0.02;
  group.add(rimMesh);

  // Secondary soft outer rim halo
  const haloGeom = new THREE.RingGeometry(radius * 1.04, radius * 1.15, 64);
  const haloMat = new THREE.MeshBasicMaterial({
    color: '#21102D',
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide
  });
  const haloMesh = new THREE.Mesh(haloGeom, haloMat);
  haloMesh.position.z = 0.01;
  group.add(haloMesh);

  group.userData = {
    coreMesh,
    rimMesh,
    haloMesh
  };

  return group;
}

/**
 * Creates the Luminous Trajectory Line for Scene 08.
 * Traces the camera path through previous memory coordinates ("NONE OF IT WAS WASTED").
 */
export function createTrajectoryLine() {
  // Sample points along cameraSpline from 0.0 up to Scene 08 (0.85)
  const sampleCount = 120;
  const points = [];
  for (let i = 0; i <= sampleCount; i++) {
    const t = (i / sampleCount) * 0.86;
    points.push(cameraSpline.getPointAt(t));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: '#69358A',
    transparent: true,
    opacity: 0.0,
    linewidth: 1
  });

  const line = new THREE.Line(geometry, material);
  return line;
}
