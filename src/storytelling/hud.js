import * as THREE from 'three';

/**
 * Creates the White Sci-Fi Tactical HUD Overlay.
 * Includes:
 * - Razor-sharp SVG Viewfinder with 45-degree chamfers and solid white side grip brackets
 * - Outer 4-corner reticles with tick marks and header branding
 * - 3D Holographic parallax depth responding to mouse/touch orientation
 * - Dynamic 3D screen-space projection tracking and lock-on over memory artifacts
 * - Narrative state transitions (Tactical -> Glitch/Decay -> Reboot -> Celestial Gold)
 * - Live kinetic velocity meter, celestial gyro dial, and audio waveform visualizer
 * - Built-in zero-dependency Web Audio cybernetic micro-synthesizer
 */
export function createSciFiHUD(container) {
  // 1. HUD Root Element
  const hudRoot = document.createElement('div');
  hudRoot.className = 'scifi-hud-root';

  hudRoot.innerHTML = `
    <!-- 3D Perspective Stage -->
    <div class="scifi-hud-stage">
      
      <!-- Layer 0: Outer Viewport Reticles & Top Navigation Bar -->
      <div class="scifi-hud-layer scifi-hud-layer-0">
        <!-- Top Navigation Bar -->
        <header class="hud-top-bar">
          <div class="hud-top-left">
            <span class="hud-crosshair">+</span>
            <span class="hud-meta-code">SYS.RECON // ARCHIVE_V2.4</span>
            <span class="hud-divider">|</span>
            <span class="hud-sector-tag" id="hudSectorTag">SECTOR 01</span>
          </div>

          <div class="hud-top-center">
            <span class="hud-title">DOME // ARCHIVE</span>
          </div>

          <div class="hud-top-right">
            <!-- Animated Audio Waveform -->
            <div class="hud-waveform" id="hudWaveform" title="Signal Spectrum">
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
            </div>
            <!-- Interactive Audio Toggle -->
            <button class="hud-audio-btn" id="hudAudioBtn" type="button" aria-label="Toggle Audio">
              <span class="audio-brackets">|•|</span>
              <span class="audio-label" id="hudAudioLabel">AUDIO</span>
            </button>
          </div>
        </header>

        <!-- Outer 4-Corner Reticles -->
        <div class="hud-corner hud-corner-tl">
          <svg viewBox="0 0 40 40" class="corner-svg">
            <path d="M 0 30 L 0 0 L 30 0" fill="none" stroke="currentColor" stroke-width="1.5" />
            <line x1="8" y1="8" x2="16" y2="8" stroke="currentColor" stroke-width="1" />
            <line x1="8" y1="8" x2="8" y2="16" stroke="currentColor" stroke-width="1" />
          </svg>
        </div>
        <div class="hud-corner hud-corner-tr">
          <svg viewBox="0 0 40 40" class="corner-svg">
            <path d="M 40 30 L 40 0 L 10 0" fill="none" stroke="currentColor" stroke-width="1.5" />
            <line x1="32" y1="8" x2="24" y2="8" stroke="currentColor" stroke-width="1" />
            <line x1="32" y1="8" x2="32" y2="16" stroke="currentColor" stroke-width="1" />
          </svg>
        </div>
        <div class="hud-corner hud-corner-bl">
          <svg viewBox="0 0 40 40" class="corner-svg">
            <path d="M 0 10 L 0 40 L 30 40" fill="none" stroke="currentColor" stroke-width="1.5" />
            <line x1="8" y1="32" x2="16" y2="32" stroke="currentColor" stroke-width="1" />
            <line x1="8" y1="32" x2="8" y2="24" stroke="currentColor" stroke-width="1" />
          </svg>
        </div>
        <div class="hud-corner hud-corner-br">
          <svg viewBox="0 0 40 40" class="corner-svg">
            <path d="M 40 10 L 40 40 L 10 40" fill="none" stroke="currentColor" stroke-width="1.5" />
            <line x1="32" y1="32" x2="24" y2="32" stroke="currentColor" stroke-width="1" />
            <line x1="32" y1="32" x2="32" y2="24" stroke="currentColor" stroke-width="1" />
          </svg>
        </div>

        <!-- Bottom Status Line -->
        <footer class="hud-bottom-bar">
          <div class="hud-bottom-left">
            <div class="hud-gyro-dial">
              <svg viewBox="0 0 32 32" class="gyro-svg" id="hudGyroSvg">
                <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 3" />
                <line x1="16" y1="2" x2="16" y2="30" stroke="currentColor" stroke-width="1" />
                <line x1="2" y1="16" x2="30" y2="16" stroke="currentColor" stroke-width="1" />
                <polygon points="16,4 19,10 13,10" fill="currentColor" />
              </svg>
            </div>
            <div class="hud-coord-info">
              <span class="coord-label">VECTOR ORIENTATION</span>
              <span class="coord-val" id="hudCoordVal">Z: -000.00 M // AZ: 00.0°</span>
            </div>
          </div>

          <div class="hud-bottom-right">
            <div class="hud-velocity-widget">
              <span class="vel-label">WARP INERTIA</span>
              <div class="vel-bar-track">
                <div class="vel-bar-fill" id="hudVelBar"></div>
              </div>
              <span class="vel-val" id="hudVelVal">000 KM/S</span>
            </div>
          </div>
        </footer>
      </div>

      <!-- Layer 1: The Tactical Viewfinder (Reference Hero Element) -->
      <div class="scifi-hud-layer scifi-hud-layer-1">
        <div class="hud-viewfinder-container">
          
          <!-- Chamfered SVG Frame with Left & Right Solid Grips -->
          <svg class="hud-viewfinder-svg" viewBox="0 0 1000 600" preserveAspectRatio="none">
            <!-- 45-degree Chamfered Frame Path -->
            <path
              class="vf-frame-path"
              d="M 50 0 L 950 0 L 1000 50 L 1000 550 L 950 600 L 50 600 L 0 550 L 0 50 Z"
              vector-effect="non-scaling-stroke"
            />
            
            <!-- Left Solid White Bracket Grip with Chamfered Corners -->
            <polygon
              class="vf-grip-bracket vf-grip-left"
              points="0,250 14,264 14,336 0,350"
            />

            <!-- Right Solid White Bracket Grip with Chamfered Corners -->
            <polygon
              class="vf-grip-bracket vf-grip-right"
              points="1000,250 986,264 986,336 1000,350"
            />

            <!-- Corner Accent Ticks -->
            <line x1="60" y1="6" x2="120" y2="6" class="vf-accent-line" vector-effect="non-scaling-stroke" />
            <line x1="880" y1="594" x2="940" y2="594" class="vf-accent-line" vector-effect="non-scaling-stroke" />
          </svg>

          <!-- Top-Left Scene Header -->
          <div class="vf-header">
            <span class="vf-header-plus">+</span>
            <span class="vf-header-title" id="vfTitle">URBAN SYSTEMS</span>
          </div>

          <!-- Top-Right Indicators (Filled & Hollow Squares from Reference) -->
          <div class="vf-status-indicators">
            <span class="vf-sq vf-sq-solid" title="Primary Status">■</span>
            <span class="vf-sq vf-sq-hollow" title="Buffer Status">□</span>
            <span class="vf-status-code" id="vfStatusCode">REC.ACTIVE</span>
          </div>

          <!-- Bottom-Right Monospace Telemetry Description -->
          <div class="vf-telemetry-box">
            <p class="vf-telemetry-text" id="vfTelemetry">
              THE CITY'S CENTRAL AI NODE POWERING REAL-TIME SERVICES,
              INTELLIGENT COORDINATION, AND AUTONOMOUS OPERATIONS.
            </p>
          </div>

        </div>
      </div>

      <!-- Layer 2: Center Optical Reticle & 3D Spatial Artifact Lock-On -->
      <div class="scifi-hud-layer scifi-hud-layer-2">
        
        <!-- Center Target Reticle (Diamond from Reference) -->
        <div class="hud-center-diamond" id="hudCenterDiamond">
          <div class="diamond-shape"></div>
          <div class="diamond-chevron"></div>
        </div>

        <!-- Dynamic 3D Spatial Lock-On Reticle (Tracks Objects in 3D Space) -->
        <div class="hud-spatial-lock" id="hudSpatialLock">
          <div class="lock-bracket lock-bracket-tl"></div>
          <div class="lock-bracket lock-bracket-tr"></div>
          <div class="lock-bracket lock-bracket-bl"></div>
          <div class="lock-bracket lock-bracket-br"></div>
          <div class="lock-center-cross"></div>
          <div class="lock-tag" id="hudLockTag">TARGET LOCKED // DIST: 12.4M</div>
        </div>

        <!-- Glitch / Corrupted Data Stream Overlay -->
        <div class="hud-glitch-stream" id="hudGlitchStream">
          <div class="glitch-line">0x7F2A_DECAY // SEGMENT_VIOLATION</div>
          <div class="glitch-line">CARRIER_SIGNAL: ATTENUATING 14.8%</div>
        </div>

      </div>

    </div>
  `;

  container.appendChild(hudRoot);

  // 2. Query DOM Elements
  const stage = hudRoot.querySelector('.scifi-hud-stage');
  const vfTitle = hudRoot.querySelector('#vfTitle');
  const vfStatusCode = hudRoot.querySelector('#vfStatusCode');
  const vfTelemetry = hudRoot.querySelector('#vfTelemetry');
  const hudSectorTag = hudRoot.querySelector('#hudSectorTag');
  const hudCoordVal = hudRoot.querySelector('#hudCoordVal');
  const hudVelBar = hudRoot.querySelector('#hudVelBar');
  const hudVelVal = hudRoot.querySelector('#hudVelVal');
  const hudGyroSvg = hudRoot.querySelector('#hudGyroSvg');
  const hudSpatialLock = hudRoot.querySelector('#hudSpatialLock');
  const hudLockTag = hudRoot.querySelector('#hudLockTag');
  const hudGlitchStream = hudRoot.querySelector('#hudGlitchStream');
  const hudAudioBtn = hudRoot.querySelector('#hudAudioBtn');
  const hudAudioLabel = hudRoot.querySelector('#hudAudioLabel');
  const hudWaveform = hudRoot.querySelector('#hudWaveform');

  // 3. Web Audio Micro-Synthesizer State
  let audioCtx = null;
  let audioEnabled = false;
  let lastAudioTickTime = 0;

  function initAudio() {
    if (audioCtx) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    } catch (e) {
      console.warn('Web Audio not supported:', e);
    }
  }

  function playCyberTick(freq = 4200, duration = 0.008) {
    if (!audioEnabled || !audioCtx || audioCtx.state !== 'running') return;
    const now = audioCtx.currentTime;
    if (now - lastAudioTickTime < 0.045) return; // debounce clicks
    lastAudioTickTime = now;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + duration);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  function playLockChirp() {
    if (!audioEnabled || !audioCtx || audioCtx.state !== 'running') return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(2600, now + 0.035);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  function toggleAudio() {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    audioEnabled = !audioEnabled;
    if (audioEnabled) {
      hudAudioLabel.textContent = 'ONLINE';
      hudAudioBtn.classList.add('is-active');
      hudWaveform.classList.add('is-active');
      playLockChirp();
    } else {
      hudAudioLabel.textContent = 'MUTED';
      hudAudioBtn.classList.remove('is-active');
      hudWaveform.classList.remove('is-active');
    }
  }

  hudAudioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleAudio();
  });

  // 4. Holographic 3D Mouse Parallax State
  let targetTiltX = 0;
  let targetTiltY = 0;
  let currentTiltX = 0;
  let currentTiltY = 0;

  function onMouseMove(e) {
    const halfW = window.innerWidth * 0.5;
    const halfH = window.innerHeight * 0.5;
    const normX = (e.clientX - halfW) / halfW;
    const normY = (e.clientY - halfH) / halfH;
    targetTiltX = -normY * 3.5; // degrees
    targetTiltY = normX * 4.0;
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });

  // 5. Scene Narrative Data Dictionary
  const narrativeChapters = [
    {
      range: [0.0, 0.15],
      sector: 'SECTOR 01',
      title: 'THE SILENCE',
      status: 'RECON.ACQ',
      telemetry: "RECOVERING UNFINISHED REPOSITORY DATA. EARLY EXPERIMENTAL CODE DETECTED IN DEEP VOID.",
      phase: 'tactical'
    },
    {
      range: [0.15, 0.28],
      sector: 'SECTOR 02',
      title: 'INCOMPLETE SUCCESS',
      status: 'ANOMALY',
      telemetry: "STRUCTURAL INTEGRITY FRACTURED. CRITERIA NEVER MET THRESHOLD OF PRIDE OR RESOLUTION.",
      phase: 'tactical'
    },
    {
      range: [0.28, 0.40],
      sector: 'SECTOR 03',
      title: 'DISASSEMBLY',
      status: 'DISSOLVING',
      telemetry: "ABANDONED REPOSITORIES DISINTEGRATING VIA SIMPLEX VOID EROSION. STRUCTURAL DRIFT CONFIRMED.",
      phase: 'glitch'
    },
    {
      range: [0.40, 0.52],
      sector: 'SECTOR 04',
      title: 'SIGNAL LOSS',
      status: 'DECAY 14%',
      telemetry: "FORGOTTEN ARTIFACT CARRIER FREQUENCY FAILING. ARCHIVAL PURGE PROTOCOL EXECUTING IN DARK SPACE.",
      phase: 'glitch'
    },
    {
      range: [0.52, 0.64],
      sector: 'SECTOR 05',
      title: 'THE UNSEEN',
      status: 'OCCULTED',
      telemetry: "CELESTIAL ECLIPSE EVENT DETECTED. SILENT WORK PASSING BEHIND SOLAR EVENT HORIZON.",
      phase: 'glitch'
    },
    {
      range: [0.64, 0.76],
      sector: 'SECTOR 06',
      title: 'TURNING POINT',
      status: 'OVERRIDE',
      telemetry: "PERSISTENCE OVERRIDE ENGAGED. 'แต่ผมยังทำต่อ' VORTEX STABILIZING DRIFT TRAJECTORY.",
      phase: 'reboot'
    },
    {
      range: [0.76, 0.86],
      sector: 'SECTOR 07',
      title: 'RECONSTRUCTION',
      status: 'HYPERDRIVE',
      telemetry: "1,400 DISPERSED MEMORY PARTICLES STREAMING FORWARD. UNIFIED CAPABILITIES FORGING AHEAD.",
      phase: 'celestial'
    },
    {
      range: [0.86, 0.96],
      sector: 'SECTOR 08',
      title: 'CELESTIAL ARCHIVE',
      status: 'VERIFIED',
      telemetry: "PRISTINE CREATIVE ARTIFACTS ONLINE. PHYSICAL TRAJECTORY VALIDATED: NONE OF IT WAS WASTED.",
      phase: 'celestial'
    },
    {
      range: [0.96, 1.01],
      sector: 'FINAL CORE',
      title: 'SELECTED WORKS',
      status: 'ENTRY.READY',
      telemetry: "ALL EFFORTS CONVERGED INTO ONE BODY OF WORK. READY FOR FLY-THROUGH INTO EXHIBITION.",
      phase: 'celestial'
    }
  ];

  let currentChapterIndex = -1;
  let lastProgress = 0;
  let smoothedVelocity = 0;
  let lastLockOnTarget = null;
  const tempProjectVec = new THREE.Vector3();

  /**
   * Main update function called on every animation frame by timeline.evaluate()
   */
  function update(progress, time, camera, artifacts) {
    const p = Math.max(0, Math.min(1, progress));

    // A. Holographic 3D Tilt Damping
    currentTiltX += (targetTiltX - currentTiltX) * 0.08;
    currentTiltY += (targetTiltY - currentTiltY) * 0.08;
    stage.style.transform = `rotateX(${currentTiltX.toFixed(2)}deg) rotateY(${currentTiltY.toFixed(2)}deg)`;

    // B. Calculate Velocity & Kinetic Audio Ticks
    const progressDelta = Math.abs(p - lastProgress);
    lastProgress = p;
    const instantVelocity = (progressDelta / 0.016) * 1000; // units/sec
    smoothedVelocity += (instantVelocity - smoothedVelocity) * 0.12;

    if (progressDelta > 0.0003) {
      playCyberTick(3600 + Math.min(smoothedVelocity * 8, 4000));
    }

    const displaySpeed = Math.round(smoothedVelocity * 2.8);
    hudVelVal.textContent = `${String(displaySpeed).padStart(3, '0')} KM/S`;
    hudVelBar.style.width = `${Math.min(displaySpeed / 6, 100)}%`;

    // C. Gyro Compass Rotation & Coordinate Display
    if (camera) {
      const zDepth = Math.abs(camera.position.z).toFixed(1);
      const yawDeg = ((camera.rotation.y * 180) / Math.PI).toFixed(1);
      hudCoordVal.textContent = `Z: -${String(zDepth).padStart(5, '0')} M // AZ: ${yawDeg}°`;
      hudGyroSvg.style.transform = `rotate(${camera.rotation.y * 45}deg)`;
    }

    // D. Narrative Chapter Updates
    let activeChapter = narrativeChapters[0];
    let activeIdx = 0;
    for (let i = 0; i < narrativeChapters.length; i++) {
      const c = narrativeChapters[i];
      if (p >= c.range[0] && p < c.range[1]) {
        activeChapter = c;
        activeIdx = i;
        break;
      }
    }

    if (activeIdx !== currentChapterIndex) {
      currentChapterIndex = activeIdx;
      vfTitle.textContent = activeChapter.title;
      vfStatusCode.textContent = activeChapter.status;
      vfTelemetry.textContent = activeChapter.telemetry;
      hudSectorTag.textContent = activeChapter.sector;

      // Update Phase CSS classes
      hudRoot.classList.remove('phase-tactical', 'phase-glitch', 'phase-reboot', 'phase-celestial');
      hudRoot.classList.add(`phase-${activeChapter.phase}`);

      if (activeChapter.phase === 'reboot') {
        playCyberTick(1800, 0.04);
      }
    }

    // E. 3D Spatial Lock-On Tracking
    if (camera && artifacts) {
      let targetMesh = null;
      let targetId = '';

      if (p >= 0.02 && p <= 0.18) {
        targetMesh = artifacts.fail1;
        targetId = 'FAIL_001 // EXP';
      } else if (p > 0.18 && p <= 0.38) {
        targetMesh = artifacts.fail2;
        targetId = 'FAIL_002 // MOBILE';
      } else if (p > 0.38 && p <= 0.52) {
        targetMesh = artifacts.fail3;
        targetId = 'FAIL_003 // SIGNAL';
      } else if (p > 0.52 && p <= 0.65) {
        targetMesh = artifacts.fail4;
        targetId = 'FAIL_004 // SOLAR';
      } else if (p > 0.77 && p <= 0.94) {
        targetMesh = artifacts.final1;
        targetId = 'FINAL_001 // PRISTINE';
      }

      if (targetMesh && targetMesh.visible !== false) {
        tempProjectVec.setFromMatrixPosition(targetMesh.matrixWorld);
        const dist = camera.position.distanceTo(tempProjectVec);
        tempProjectVec.project(camera);

        // Check if object is in front of camera
        if (tempProjectVec.z < 1.0 && tempProjectVec.z > -1.0) {
          const rawScreenX = (tempProjectVec.x * 0.5 + 0.5) * window.innerWidth;
          const rawScreenY = (-(tempProjectVec.y * 0.5) + 0.5) * window.innerHeight;

          // Safe clamping so lock-on tag stays fully within screen viewport
          const screenX = Math.max(180, Math.min(window.innerWidth - 180, rawScreenX));
          const screenY = Math.max(100, Math.min(window.innerHeight - 100, rawScreenY));

          hudSpatialLock.style.opacity = '1';
          hudSpatialLock.style.transform = `translate3d(${screenX.toFixed(1)}px, ${screenY.toFixed(1)}px, 0)`;
          hudLockTag.textContent = `TARGET: [${targetId}] // DIST: ${dist.toFixed(1)}M`;

          if (lastLockOnTarget !== targetId) {
            lastLockOnTarget = targetId;
            playLockChirp();
          }
        } else {
          hudSpatialLock.style.opacity = '0';
          lastLockOnTarget = null;
        }
      } else {
        hudSpatialLock.style.opacity = '0';
        lastLockOnTarget = null;
      }
    }

    // F. Glitch Stream Generator in Phase 2
    if (activeChapter.phase === 'glitch') {
      hudGlitchStream.style.opacity = (0.5 + Math.sin(time * 12.0) * 0.45).toFixed(2);
      if (Math.random() < 0.08) {
        const hex = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
        hudGlitchStream.children[0].textContent = `0x${hex}_DECAY // MEMORY_PURGE`;
        hudGlitchStream.children[1].textContent = `SIGNAL_INTEGRITY: ${(Math.max(4, 45 - p * 60)).toFixed(1)}%`;
      }
    } else {
      hudGlitchStream.style.opacity = '0';
    }
  }

  function destroy() {
    window.removeEventListener('mousemove', onMouseMove);
    if (hudRoot.parentElement) {
      hudRoot.parentElement.removeChild(hudRoot);
    }
    if (audioCtx) {
      audioCtx.close().catch(() => {});
    }
  }

  return {
    root: hudRoot,
    update,
    destroy
  };
}
