import './storytelling.css';
import { createStorytellingScene } from './scene.js';
import { createJourneyTimeline } from './timeline.js';
import { createSciFiHUD } from './hud.js';

export async function createStorytelling(options = {}) {
  const {
    onComplete = () => {},
    initialProgress = 0.0,
    autoMount = false
  } = options;

  let active = false;
  let targetProgress = initialProgress;
  let currentProgress = initialProgress;
  let rafId = 0;
  let destroyed = false;
  let lastTime = performance.now();
  let journeyCompleted = false;
  let entryPromise = null;
  let exitPromise = null;

  // 1. Container DOM Elements
  const container = document.createElement('div');
  container.className = 'storytelling-container';

  const transitionBeam = document.createElement('div');
  transitionBeam.className = 'storytelling-transition-beam';
  transitionBeam.setAttribute('aria-hidden', 'true');
  container.appendChild(transitionBeam);

  const hud = createSciFiHUD(container);

  const progressLine = document.createElement('div');
  progressLine.className = 'storytelling-progress-line';
  container.appendChild(progressLine);

  document.body.appendChild(container);

  // 2. 3D Scene & Timeline
  const sceneContext = await createStorytellingScene(container);
  const timeline = createJourneyTimeline(sceneContext, hud, progressLine);

  // Initial evaluation
  timeline.evaluate(currentProgress, 0);

  // 3. Render & Damping Loop
  function tick(now) {
    if (destroyed) return;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    // Smooth inertia damping (cinematic weight)
    currentProgress += (targetProgress - currentProgress) * Math.min(dt * 5.2, 1.0);

    // Evaluate 3D world
    timeline.evaluate(currentProgress, now / 1000);

    // Completion boundary hook
    if (currentProgress >= 0.992 && !journeyCompleted) {
      journeyCompleted = true;
      window.journeyComplete = true;
      window.dispatchEvent(new CustomEvent('storytelling:complete'));
      onComplete();
    }

    if (active) rafId = requestAnimationFrame(tick);
  }

  // 4. Input Listeners (Virtual Smooth Inertia Scroll)
  function onWheel(e) {
    if (!active || destroyed) return;
    e.preventDefault();

    const unit = e.deltaMode === 1 ? 18 : e.deltaMode === 2 ? 400 : 1;
    // Normalized sensitivity: each standard wheel click (~100px) moves ~0.009 (approx 1% of total journey)
    let rawDelta = (e.deltaY * unit) * 0.000095;
    
    // Clamp single scroll event max to prevent accidental skips from aggressive trackpad flick
    const clampedDelta = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), 0.028);

    targetProgress = Math.max(0.0, Math.min(1.0, targetProgress + clampedDelta));
  }

  let touchStartY = null;
  function onTouchStart(e) {
    if (!active || destroyed || e.touches.length !== 1) return;
    touchStartY = e.touches[0].clientY;
  }

  function onTouchMove(e) {
    if (!active || destroyed || touchStartY === null || e.touches.length !== 1) return;
    e.preventDefault();
    const touchY = e.touches[0].clientY;
    const deltaY = touchStartY - touchY;
    touchStartY = touchY;

    const delta = deltaY * 0.00045;
    targetProgress = Math.max(0.0, Math.min(1.0, targetProgress + delta));
  }

  function onTouchEnd() {
    touchStartY = null;
  }

  function onKeyDown(e) {
    if (!active || destroyed) return;
    let delta = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      delta = 0.015;
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      delta = -0.015;
    }

    // Dev scene jumps: keys 0-9
    if (import.meta.env.DEV && e.key >= '0' && e.key <= '9') {
      const sceneIndex = parseInt(e.key, 10);
      targetProgress = sceneIndex * 0.1;
      currentProgress = targetProgress;
    }

    if (delta !== 0) {
      e.preventDefault();
      targetProgress = Math.max(0.0, Math.min(1.0, targetProgress + delta));
    }
  }

  function onResize() {
    if (destroyed) return;
    sceneContext.resize();
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', onResize);

  function runEntrance() {
    if (entryPromise) return entryPromise;
    const canvas = sceneContext.renderer.domElement;
    const hudRoot = container.querySelector('.scifi-hud-root');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof canvas.animate !== 'function') {
      entryPromise = Promise.resolve();
      return entryPromise;
    }

    const timing = { duration: 1450, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' };
    const canvasAnimation = canvas.animate([
      {
        opacity: 0,
        clipPath: 'inset(49.8% 47% 49.8% 47%)',
        transform: 'scale(1.12) translate3d(1.5%, 0, 0)',
        filter: 'blur(18px) brightness(.28) saturate(.7)',
      },
      {
        offset: .22,
        opacity: .72,
        clipPath: 'inset(42% 11% 42% 11%)',
        transform: 'scale(1.075) translate3d(.8%, 0, 0)',
        filter: 'blur(9px) brightness(.65) saturate(.85)',
      },
      {
        opacity: 1,
        clipPath: 'inset(0% 0% 0% 0%)',
        transform: 'scale(1) translate3d(0, 0, 0)',
        filter: 'blur(0) brightness(1) saturate(1)',
      },
    ], timing);
    const beamAnimation = transitionBeam.animate([
      { opacity: 0, transform: 'translate(-50%, -50%) scaleX(.015)' },
      { offset: .2, opacity: .72, transform: 'translate(-50%, -50%) scaleX(.48)' },
      { offset: .58, opacity: .3, transform: 'translate(-50%, -50%) scaleX(1)' },
      { opacity: 0, transform: 'translate(-50%, -50%) scaleX(1)' },
    ], { duration: 1050, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' });
    const hudAnimation = hudRoot?.animate([
      { opacity: 0, transform: 'scale(.975)', filter: 'blur(5px)' },
      { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' },
    ], { duration: 900, delay: 480, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
    entryPromise = Promise.allSettled([canvasAnimation.finished, beamAnimation.finished, hudAnimation?.finished]);
    return entryPromise;
  }

  function start() {
    active = true;
    container.classList.add('is-active');
    document.body.style.overflow = 'hidden';
    document.body.style.background = '#0E0E0E';
    lastTime = performance.now();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
    runEntrance();
  }

  function transitionOut() {
    if (exitPromise) return exitPromise;
    active = false;
    cancelAnimationFrame(rafId);
    const canvas = sceneContext.renderer.domElement;
    const hudRoot = container.querySelector('.scifi-hud-root');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || typeof container.animate !== 'function') {
      container.style.opacity = '0';
      exitPromise = new Promise((resolve) => setTimeout(resolve, 220));
      return exitPromise;
    }

    container.classList.add('is-exiting');
    const canvasAnimation = canvas.animate([
      {
        opacity: 1,
        clipPath: 'inset(0% 0% 0% 0%)',
        transform: 'scale(1)',
        filter: 'blur(0) brightness(1) saturate(1)',
      },
      {
        offset: .56,
        opacity: 1,
        clipPath: 'inset(43% 0% 43% 0%)',
        transform: 'scale(1.035)',
        filter: 'blur(3px) brightness(.9) saturate(.78)',
      },
      {
        offset: .82,
        opacity: .82,
        clipPath: 'inset(49.65% 0% 49.65% 0%)',
        transform: 'scale(1.08)',
        filter: 'blur(7px) brightness(1.3) saturate(.5)',
      },
      {
        opacity: 0,
        clipPath: 'inset(50% 0% 50% 0%)',
        transform: 'scale(1.1)',
        filter: 'blur(10px) brightness(.2) saturate(0)',
      },
    ], { duration: 1320, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'both' });
    const beamAnimation = transitionBeam.animate([
      { opacity: 0, transform: 'translate(-50%, -50%) scaleX(.04)' },
      { offset: .62, opacity: .12, transform: 'translate(-50%, -50%) scaleX(.72)' },
      { offset: .82, opacity: .72, transform: 'translate(-50%, -50%) scaleX(1)' },
      { opacity: 0, transform: 'translate(-50%, -50%) scaleX(.02)' },
    ], { duration: 1380, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'both' });
    const hudAnimation = hudRoot?.animate([
      { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' },
      { opacity: 0, transform: 'scale(1.025)', filter: 'blur(7px)' },
    ], { duration: 560, easing: 'cubic-bezier(.4,0,1,1)', fill: 'both' });
    exitPromise = Promise.allSettled([canvasAnimation.finished, beamAnimation.finished, hudAnimation?.finished]);
    return exitPromise;
  }

  function setProgress(p) {
    targetProgress = Math.max(0.0, Math.min(1.0, p));
    currentProgress = targetProgress;
  }

  function destroy() {
    destroyed = true;
    active = false;
    cancelAnimationFrame(rafId);
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', onResize);
    hud.destroy();
    sceneContext.dispose();
    container.remove();
  }

  if (autoMount) {
    start();
  }

  return {
    start,
    transitionOut,
    setProgress,
    destroy,
    get rendererInfo() { return sceneContext.renderer.info.render; },
    get progress() { return currentProgress; },
    get isCompleted() { return journeyCompleted; }
  };
}
