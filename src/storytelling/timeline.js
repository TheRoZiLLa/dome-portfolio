import * as THREE from 'three';
import { cameraSpline, lookAtSpline, getCameraFov, getCameraRoll } from './splines.js';
import { updateTextScramble, updateAutoDecodeText } from './typography.js';

export function createJourneyTimeline(sceneContext, hudElement, progressLineElement) {
  const {
    scene,
    camera,
    ambientLight,
    dirLight,
    purpleRimLight,
    backlightTurn,
    post,
    fragmentSystem,
    trajectoryLine,
    eclipse,
    artifacts,
    texts
  } = sceneContext;

  const currentLookAt = new THREE.Vector3();
  const targetLookAt = new THREE.Vector3();

  /**
   * Evaluates the entire 3D world state for any normalized progress (0.0 to 1.0)
   */
  function evaluate(progress, time = 0) {
    const p = THREE.MathUtils.clamp(progress, 0.0, 1.0);

    // 1. Continuous Camera Spline Position
    cameraSpline.getPointAt(p, camera.position);

    // 2. Independent Camera LookAt Spline with smooth orientation
    lookAtSpline.getPointAt(p, targetLookAt);
    currentLookAt.lerp(targetLookAt, 0.25);
    camera.lookAt(currentLookAt);

    // 3. Dynamic FOV and Cinematic Roll
    camera.fov = getCameraFov(p);
    camera.rotation.z += getCameraRoll(p);
    camera.updateProjectionMatrix();

    // 4. Update Memory Fragment Particle System
    fragmentSystem.update(p, time, camera.position);

    // 5. Update Sci-Fi Tactical HUD Overlay
    if (hudElement && typeof hudElement.update === 'function') {
      hudElement.update(p, time, camera, artifacts);
    }

    // 6. Update Progress Line Indicator
    if (progressLineElement) {
      progressLineElement.style.width = `${p * 100}%`;
    }

    // Post-processing uniform defaults
    let chromatic = 0.001;
    let fisheye = 0.0;
    let grain = 0.026;

    /**
     * Velvety smooth Hermite envelope with zero velocity at both ends.
     * Starts smoothly at inStart, reaches 1.0 at inEnd, stays at 1.0 until outStart,
     * and smoothly returns to 0.0 at outEnd.
     */
    function smoothRange(val, inStart, inEnd, outStart, outEnd) {
      if (val <= inStart || val >= outEnd) return 0.0;
      if (val >= inEnd && val <= outStart) return 1.0;
      if (val < inEnd) {
        const t = (val - inStart) / (inEnd - inStart);
        return t * t * (3.0 - 2.0 * t);
      } else {
        const t = (val - outStart) / (outEnd - outStart);
        return 1.0 - t * t * (3.0 - 2.0 * t);
      }
    }

    // ==========================================
    // SCENE 01: THE SILENCE (0.00 -> 0.12)
    // ==========================================
    const showScene01 = p >= 0.015 && p <= 0.14;
    updateAutoDecodeText(texts.scene01, time, showScene01, 0.45);

    const s1Fade = smoothRange(p, 0.01, 0.05, 0.09, 0.14);
    texts.scene01.material.opacity = s1Fade;
    texts.scene01.position.y = (texts.scene01.userData.baseY ?? -2.4) + (1.0 - Math.min(s1Fade * 1.5, 1.0)) * -0.45 + Math.sin(time * 1.2) * 0.03;

    const fail1Mat = artifacts.fail1.userData.imgMat;
    fail1Mat.uniforms.uOpacity.value = smoothRange(p, 0.005, 0.05, 0.09, 0.15);
    fail1Mat.uniforms.uTime.value = time;

    // ==========================================
    // SCENE 02: REALIZATION & INCOMPLETE SUCCESS (0.10 -> 0.27)
    // ==========================================
    const showScene02A = p >= 0.08 && p <= 0.27;
    const showScene02B = p >= 0.11 && p <= 0.27;
    updateAutoDecodeText(texts.scene02A, time, showScene02A, 0.45);
    updateAutoDecodeText(texts.scene02B, time, showScene02B, 0.45);

    const s2AFade = smoothRange(p, 0.08, 0.14, 0.20, 0.26);
    texts.scene02A.material.opacity = s2AFade;
    texts.scene02A.position.y = (texts.scene02A.userData.baseY ?? 4.5) + (1.0 - Math.min(s2AFade * 1.5, 1.0)) * -0.4;

    const s2BFade = smoothRange(p, 0.11, 0.17, 0.21, 0.27);
    texts.scene02B.material.opacity = s2BFade;
    texts.scene02B.position.y = (texts.scene02B.userData.baseY ?? 2.2) + (1.0 - Math.min(s2BFade * 1.5, 1.0)) * -0.4;

    // Broken "สำเร็จ" Structure
    const s2StructFade = smoothRange(p, 0.10, 0.17, 0.21, 0.28);
    texts.structureSuccess.userData.mainText.material.opacity = s2StructFade * 0.95;
    texts.structureSuccess.userData.wireMesh.material.opacity = s2StructFade * 0.32;
    texts.structureSuccess.userData.shardGroup.children.forEach((shard) => {
      shard.rotation.x += 0.008;
      shard.rotation.y += 0.012;
    });

    // fail2, fail3, fail4 emerge at distinct depths with silky ramps
    artifacts.fail2.userData.imgMat.uniforms.uOpacity.value = smoothRange(p, 0.12, 0.22, 0.34, 0.40);
    artifacts.fail3.userData.imgMat.uniforms.uOpacity.value = smoothRange(p, 0.16, 0.28, 0.46, 0.52);
    artifacts.fail4.userData.imgMat.uniforms.uOpacity.value = smoothRange(p, 0.22, 0.36, 0.56, 0.62);

    // ==========================================
    // SCENE 03: ABANDONED / FAIL2 DISASSEMBLY (0.24 -> 0.38)
    // ==========================================
    const showScene03 = p >= 0.23 && p <= 0.39;
    updateAutoDecodeText(texts.scene03, time, showScene03, 0.45);

    const s3Fade = smoothRange(p, 0.23, 0.28, 0.33, 0.38);
    texts.scene03.material.opacity = s3Fade;
    texts.scene03.position.y = (texts.scene03.userData.baseY ?? -2.0) + (1.0 - Math.min(s3Fade * 1.5, 1.0)) * -0.4;

    const fail2 = artifacts.fail2;
    const fail2Mat = fail2.userData.imgMat;
    fail2Mat.uniforms.uTime.value = time;
    fail2Mat.uniforms.uDissolve.value = smoothRange(p, 0.26, 0.36, 0.38, 0.44) * 0.82;
    fail2Mat.uniforms.uGlitch.value = (p > 0.27 && p < 0.34) ? (Math.sin((p - 0.27) / 0.07 * Math.PI) * 0.32) : 0.0;
    chromatic += fail2Mat.uniforms.uGlitch.value * 0.012;

    // Disassemble detachable frame fragments smoothly
    const shardDriftT = smoothRange(p, 0.25, 0.36, 0.38, 0.45);
    fail2.userData.detachableShards.forEach((shard) => {
      const drift = shard.userData.driftVel;
      const base = shard.userData.basePos;
      const driftAmount = shardDriftT * 4.5;
      shard.position.set(
        base.x + drift.x * driftAmount,
        base.y + drift.y * driftAmount,
        base.z + drift.z * driftAmount
      );
      shard.rotation.x += shard.userData.rotVel.x * 0.02;
      shard.rotation.y += shard.userData.rotVel.y * 0.02;
    });

    // ==========================================
    // SCENE 04: FORGOTTEN / FAIL3 SIGNAL LOSS (0.36 -> 0.49)
    // ==========================================
    const showScene04 = p >= 0.34 && p <= 0.50;
    updateAutoDecodeText(texts.scene04, time, showScene04, 0.45);

    const s4Fade = smoothRange(p, 0.34, 0.39, 0.44, 0.49);
    texts.scene04.material.opacity = s4Fade;
    texts.scene04.position.y = (texts.scene04.userData.baseY ?? 0.5) + (1.0 - Math.min(s4Fade * 1.5, 1.0)) * -0.4;

    // fail3 signal fades as camera distance increases
    const signalLevel = Math.max(0, 1.0 - THREE.MathUtils.smoothstep(p, 0.36, 0.47));
    artifacts.fail3.userData.imgMat.uniforms.uSignal.value = signalLevel;
    artifacts.fail3.userData.imgMat.uniforms.uTime.value = time;

    // ==========================================
    // SCENE 05: UNSEEN / FAIL4 ECLIPSE (0.47 -> 0.60)
    // ==========================================
    const showScene05 = p >= 0.46 && p <= 0.61;
    updateAutoDecodeText(texts.scene05, time, showScene05, 0.45);

    const s5Fade = smoothRange(p, 0.46, 0.51, 0.55, 0.60);
    texts.scene05.material.opacity = s5Fade;
    texts.scene05.position.y = (texts.scene05.userData.baseY ?? 4.2) + (1.0 - Math.min(s5Fade * 1.5, 1.0)) * -0.4;

    // Dark celestial eclipse body crosses smoothly between camera and fail4
    const eclipseT = THREE.MathUtils.smoothstep(p, 0.48, 0.58);
    eclipse.position.x = THREE.MathUtils.lerp(8.0, 0.0, eclipseT);
    eclipse.userData.rimMesh.material.opacity = 0.75 + Math.sin(time * 2.0) * 0.2;
    artifacts.fail4.userData.imgMat.uniforms.uTime.value = time;

    // ==========================================
    // SCENE 06: TURNING POINT / "แต่ผมยังทำต่อ" (0.58 -> 0.74)
    // ==========================================
    const showHeroTurn = p >= 0.58 && p <= 0.75;
    updateAutoDecodeText(texts.heroTurn, time, showHeroTurn, 0.45);

    // Drifting words "ถูกทิ้ง", "ถูกลืม", "ไม่มีใครเห็น" drift back and fade smoothly
    const driftFade = smoothRange(p, 0.56, 0.59, 0.63, 0.68);
    texts.drift1.material.opacity = driftFade * 0.75;
    texts.drift2.material.opacity = driftFade * 0.75;
    texts.drift3.material.opacity = driftFade * 0.75;

    const driftZOffset = THREE.MathUtils.smoothstep(p, 0.56, 0.68) * -22.0;
    texts.drift1.position.z = (texts.drift1.userData.baseZ ?? -375) + driftZOffset;
    texts.drift2.position.z = (texts.drift2.userData.baseZ ?? -388) + driftZOffset;
    texts.drift3.position.z = (texts.drift3.userData.baseZ ?? -400) + driftZOffset;

    // Hero Turn Typography: "แต่ผมยังทำต่อ"
    const heroFade = smoothRange(p, 0.59, 0.65, 0.71, 0.76);
    texts.heroTurn.material.opacity = heroFade;
    texts.heroTurn.position.y = (texts.heroTurn.userData.baseY ?? 0) + (1.0 - Math.min(heroFade * 1.4, 1.0)) * -0.4;

    // Volumetric backlight behind "ทำต่อ"
    backlightTurn.intensity = smoothRange(p, 0.60, 0.66, 0.70, 0.75) * 5.0;

    // Micro-fisheye during fly-through
    if (p > 0.66 && p < 0.74) {
      const fishSp = (p - 0.66) / 0.08;
      fisheye = Math.sin(fishSp * Math.PI) * 0.06;
    }

    // ==========================================
    // SCENE 07: RECONSTRUCTION / MOMENTUM (0.67 -> 0.83)
    // ==========================================
    const showScene07A = p >= 0.66 && p <= 0.83;
    const showScene07B = p >= 0.69 && p <= 0.83;
    updateAutoDecodeText(texts.scene07A, time, showScene07A, 0.45);
    updateAutoDecodeText(texts.scene07B, time, showScene07B, 0.45);

    const s7AFade = smoothRange(p, 0.66, 0.72, 0.76, 0.81);
    texts.scene07A.material.opacity = s7AFade;
    texts.scene07A.position.y = (texts.scene07A.userData.baseY ?? 2.8) + (1.0 - Math.min(s7AFade * 1.5, 1.0)) * -0.4;

    const s7BFade = smoothRange(p, 0.69, 0.75, 0.78, 0.83);
    texts.scene07B.material.opacity = s7BFade;
    texts.scene07B.position.y = (texts.scene07B.userData.baseY ?? -1.8) + (1.0 - Math.min(s7BFade * 1.5, 1.0)) * -0.4;

    // Scene lighting clarifies smoothly
    const lightT = THREE.MathUtils.smoothstep(p, 0.67, 0.78);
    ambientLight.color.set('#21102D');
    ambientLight.intensity = THREE.MathUtils.lerp(0.65, 0.85, lightT);
    dirLight.intensity = THREE.MathUtils.lerp(0.8, 1.1, lightT);

    // ==========================================
    // SCENE 08: FINAL WORKS ASSEMBLE / TRAJECTORY (0.78 -> 0.94)
    // ==========================================
    const showScene08 = p >= 0.78 && p <= 0.94;
    updateAutoDecodeText(texts.scene08, time, showScene08, 0.45);

    const s8Fade = smoothRange(p, 0.78, 0.84, 0.88, 0.93);
    texts.scene08.material.opacity = s8Fade;
    texts.scene08.position.y = (texts.scene08.userData.baseY ?? 4.0) + (1.0 - Math.min(s8Fade * 1.5, 1.0)) * -0.4;

    const showFinals = p >= 0.76 && p <= 0.97;
    artifacts.final1.visible = showFinals;
    artifacts.final2.visible = showFinals;

    // final1 & final2 assemble smoothly
    const f1Mat = artifacts.final1.userData.imgMat;
    const f2Mat = artifacts.final2.userData.imgMat;
    const f1Fade = smoothRange(p, 0.77, 0.84, 0.92, 0.96);
    const f2Fade = smoothRange(p, 0.79, 0.86, 0.92, 0.96);
    f1Mat.uniforms.uOpacity.value = f1Fade;
    f2Mat.uniforms.uOpacity.value = f2Fade;
    f1Mat.uniforms.uTime.value = time;
    f2Mat.uniforms.uTime.value = time;

    // Reveal luminous trajectory line with smooth Hermite curve
    trajectoryLine.material.opacity = smoothRange(p, 0.80, 0.86, 0.91, 0.96) * 0.45;

    // ==========================================
    // SCENE 09: THE REVEAL & FLY-THROUGH (0.88 -> 1.00)
    // ==========================================
    const showFinal = p >= 0.88;
    updateAutoDecodeText(texts.final, time, showFinal, 0.45);

    const finalFade = THREE.MathUtils.smoothstep(p, 0.88, 0.95);
    texts.final.material.opacity = finalFade;
    texts.final.position.y = (texts.final.userData.baseY ?? 0) + (1.0 - finalFade) * -0.45;

    // Camera acceleration and final micro-fisheye
    if (p > 0.94) {
      const finalSp = (p - 0.94) / 0.06;
      fisheye = finalSp * finalSp * 0.08;
    }

    // Render with post-processing pass
    post.render(scene, camera, time, { chromatic, fisheye, grain });
  }

  return {
    evaluate
  };
}
