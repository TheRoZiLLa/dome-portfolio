import * as THREE from 'three';

/**
 * Continuous CatmullRom splines for the entire 3D journey.
 * Ensures zero teleporting, seamless camera momentum, and independent lookAt tracking.
 */

// Camera physical position control points (0.0 -> 1.0 along ~600 units of Z space)
const cameraPoints = [
  new THREE.Vector3(0, 0, 0),         // 0.00: Silence start
  new THREE.Vector3(0, 0, -32),       // 0.05: Approaching fail1 & text 01
  new THREE.Vector3(6.5, 4.0, -100),  // 0.17: Orbital rise & pullback revealing field + "สำเร็จ"
  new THREE.Vector3(2.0, 2.0, -145),  // 0.24: Transition toward fail2
  new THREE.Vector3(-1.8, 0.5, -168), // 0.29: Passing beside fail2 (disassembly)
  new THREE.Vector3(0, 0, -215),      // 0.37: Moving past fail2 toward fail3
  new THREE.Vector3(0, 0, -242),      // 0.42: Viewing receding fail3 (signal fade)
  new THREE.Vector3(2.5, 0.4, -310),  // 0.53: Curving around dark celestial eclipse & fail4
  new THREE.Vector3(0, 0, -355),      // 0.60: Entering turning point void & drifting words
  new THREE.Vector3(0, 0, -395),      // 0.67: Approaching "แต่ผมยังทำต่อ"
  new THREE.Vector3(0, 0, -418),      // 0.70: Flown THROUGH "แต่ผมยังทำต่อ"
  new THREE.Vector3(0, 0.4, -450),    // 0.76: Swarming particles reversal
  new THREE.Vector3(-2.2, 0.3, -505), // 0.85: Gliding past final1
  new THREE.Vector3(2.2, -0.3, -528), // 0.89: Gliding past final2
  new THREE.Vector3(0, 0, -560),      // 0.94: Directly approaching "นี่คือผลงานของผม"
  new THREE.Vector3(0, 0, -610)       // 1.00: Flown THROUGH final typography into horizon
];

// Independent lookAt target points (0.0 -> 1.0)
const targetPoints = [
  new THREE.Vector3(0, 0.4, -48),     // 0.00: Looking at fail1 in dark void
  new THREE.Vector3(0, 0.4, -48),     // 0.05: Looking directly at fail1 & text 01
  new THREE.Vector3(0.0, 2.0, -135),  // 0.17: Looking across orbital field at broken "สำเร็จ"
  new THREE.Vector3(-2.0, 0.0, -196), // 0.24: Looking toward fail2 & text 03
  new THREE.Vector3(-2.0, 0.0, -196), // 0.29: Looking at fail2 disassembling & text 03
  new THREE.Vector3(4.5, 1.0, -270),  // 0.37: Looking toward receding fail3
  new THREE.Vector3(4.5, 1.0, -270),  // 0.42: Looking at fail3 signal degradation
  new THREE.Vector3(0, 0, -350),      // 0.53: Looking at eclipse edge & fail4
  new THREE.Vector3(0, 0, -390),      // 0.60: Looking at drifting words in void
  new THREE.Vector3(0, 0, -422),      // 0.67: Looking straight through "แต่ผมยังทำต่อ"
  new THREE.Vector3(0, 0, -450),      // 0.70: Looking forward into incoming swarm
  new THREE.Vector3(0, 0, -485),      // 0.76: Looking toward assembling final archive
  new THREE.Vector3(-4.0, 0.8, -540), // 0.85: Looking toward final1
  new THREE.Vector3(4.0, -0.6, -555), // 0.89: Looking toward final2
  new THREE.Vector3(0, 0, -600),      // 0.94: Looking at "นี่คือผลงานของผม"
  new THREE.Vector3(0, 0, -660)       // 1.00: Looking into radiant horizon
];

export const cameraSpline = new THREE.CatmullRomCurve3(cameraPoints, false, 'catmullrom', 0.5);
export const lookAtSpline = new THREE.CatmullRomCurve3(targetPoints, false, 'catmullrom', 0.5);

/**
 * Returns dynamic camera FOV based on progress.
 * Subtle widening during high acceleration moments (fly-throughs).
 */
export function getCameraFov(progress) {
  // Base 45°
  let fov = 45.0;

  // Scene 06 fly-through "ทำต่อ" (0.66 - 0.73)
  if (progress > 0.66 && progress < 0.73) {
    const p = Math.sin(((progress - 0.66) / 0.07) * Math.PI);
    fov += p * 6.0;
  }

  // Scene 09 final fly-through (0.95 - 1.0)
  if (progress > 0.94) {
    const p = (progress - 0.94) / 0.06;
    fov += p * 7.0;
  }

  return fov;
}

/**
 * Returns subtle camera roll (Z-tilt) for cinematic realism.
 */
export function getCameraRoll(progress) {
  // Subtle roll during orbital pullback (Scene 02) and eclipse curving (Scene 05)
  if (progress > 0.12 && progress < 0.24) {
    return Math.sin(((progress - 0.12) / 0.12) * Math.PI) * 0.035;
  }
  if (progress > 0.50 && progress < 0.57) {
    return Math.sin(((progress - 0.50) / 0.07) * Math.PI) * -0.025;
  }
  return 0.0;
}
