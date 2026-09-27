import './style.css';
import { createJourneyTransition } from './journey/index.js';

const storytellingModule = import('./storytelling/index.js');
const workModule = import('./work/index.js');
const storyAssetUrls = [
  '/assets/journey/fail1.png',
  '/assets/journey/fail2.png',
  '/assets/journey/fail3.png',
  '/assets/journey/fail4.png',
  '/assets/journey/final1.png',
  '/assets/journey/final2.png',
];

function preloadStorytelling() {
  storyAssetUrls.forEach((url) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
  });
  document.fonts?.load('400 90px "FC Mee Sakul"');
  document.fonts?.load('600 120px "FC Mee Sakul"');
}

window.addEventListener('journey:armed', preloadStorytelling, { once: true });

const symbols = '_@/+-><?[]{}:$%&!#*';
const wordmark = document.querySelector('.wordmark');
const glyphs = [...wordmark.querySelectorAll('.glyph')];
const finalWord = wordmark.dataset.word;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let startedAt = 0;
let animationId = 0;
let lastScrambleStep = -1;
let lastResolved = -1;
export let journeyTransition;

function symbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

const settleOrder = [1, 2, 0, 3]; // 1. O, 2. M, 3. D, 4. E

function render(now) {
  if (!startedAt) startedAt = now;
  const elapsed = now - startedAt;
  const settleEvery = 260; // fast decode rate
  const resolved = Math.min(finalWord.length, Math.floor(elapsed / settleEvery));
  const scrambleStep = Math.floor(elapsed / 60);

  if (scrambleStep !== lastScrambleStep || resolved !== lastResolved) {
    const resolvedSet = new Set(settleOrder.slice(0, resolved));
    glyphs.forEach((glyph, index) => {
      glyph.textContent = resolvedSet.has(index) ? finalWord[index] : symbol();
    });
    lastScrambleStep = scrambleStep;
    lastResolved = resolved;
  }
  if (resolved < finalWord.length) {
    animationId = requestAnimationFrame(render);
  }
}

function play() {
  if (journeyTransition && !['IDLE', 'PULLING'].includes(journeyTransition.state)) return;
  cancelAnimationFrame(animationId);
  startedAt = 0;
  lastScrambleStep = -1;
  lastResolved = -1;
  if (reduceMotion.matches) {
    glyphs.forEach((glyph, index) => {
      glyph.textContent = finalWord[index];
      glyph.style.animation = 'none';
      glyph.style.transform = 'none';
    });
    return;
  }
  glyphs.forEach((glyph) => {
    glyph.style.animation = 'none';
    glyph.offsetHeight; // trigger reflow to restart CSS animation
    glyph.style.animation = '';
  });
  animationId = requestAnimationFrame(render);
}

reduceMotion.addEventListener('change', play);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r') play();
});
window.addEventListener('click', play);

play();

export let storytellingController = null;
export let workController = null;
let workTransitionStarted = false;
let storytellingLaunchPromise = null;

const params = new URLSearchParams(window.location.search);
const directStory = params.get('story') === 'true' || params.get('storytelling') === 'true';
const initialProgress = parseFloat(params.get('progress') || '0.0');

async function launchStorytelling() {
  if (storytellingController) return storytellingController;
  if (storytellingLaunchPromise) return storytellingLaunchPromise;
  storytellingLaunchPromise = (async () => {
    const { createStorytelling } = await storytellingModule;
    storytellingController = await createStorytelling({
      initialProgress: isNaN(initialProgress) ? 0.0 : initialProgress,
      autoMount: true,
      onComplete: transitionToWork
    });
    window.storytelling = storytellingController;
    return storytellingController;
  })();
  try {
    return await storytellingLaunchPromise;
  } catch (error) {
    storytellingLaunchPromise = null;
    throw error;
  }
}

async function transitionToWork() {
  if (workTransitionStarted || !storytellingController) return;
  workTransitionStarted = true;
  const { createWorkPage } = await workModule;
  workController ??= createWorkPage();
  const workReady = workController.prepare();
  await storytellingController.transitionOut();
  await workReady;
  storytellingController.destroy();
  storytellingController = null;
  await workController.enter();
}

async function launchWorkDirectly() {
  const openingEl = document.querySelector('.opening');
  if (openingEl) openingEl.hidden = true;
  const { createWorkPage } = await workModule;
  workController ??= createWorkPage();
  await workController.prepare();
  await workController.enter();
  window.work = workController;
}

const directWork = params.get('work') === 'true';

if (directWork) {
  launchWorkDirectly();
} else if (directStory) {
  const openingEl = document.querySelector('.opening');
  if (openingEl) {
    openingEl.hidden = true;
    openingEl.style.visibility = 'hidden';
  }
  document.body.style.background = '#0E0E0E';
  document.body.style.overflow = 'hidden';
  launchStorytelling();
} else {
  journeyTransition = createJourneyTransition(document.querySelector('.opening'), {
    onComplete: launchStorytelling
  });
}
