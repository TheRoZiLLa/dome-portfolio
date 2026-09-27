import './work.css';

let galaxyModulePromise;

export function createWorkPage() {
  let state = 'IDLE';
  let galaxy = null;
  let preparePromise = null;
  const element = document.createElement('main');
  element.className = 'work-page';
  element.setAttribute('aria-label', 'Selected works galaxy');
  element.hidden = true;
  document.body.appendChild(element);

  function prepare() {
    if (state === 'DESTROYED') return Promise.resolve();
    if (preparePromise) return preparePromise;
    state = 'PREPARING';
    element.hidden = false;
    element.inert = true;
    galaxyModulePromise ??= import('./galaxy.js');
    preparePromise = galaxyModulePromise.then(({ createGalaxyPortfolio }) => {
      if (state === 'DESTROYED') return;
      galaxy = createGalaxyPortfolio(element);
      state = 'PREPARED';
    });
    return preparePromise;
  }

  async function enter() {
    if (state === 'ACTIVE' || state === 'DESTROYED') return;
    await prepare();
    state = 'ACTIVE';
    element.inert = false;
    element.classList.add('is-active');
    document.documentElement.dataset.page = 'work';
    document.body.style.background = '#0E0E0E';
    document.body.style.overflow = 'hidden';
    galaxy?.start();
    window.dispatchEvent(new CustomEvent('work:ready'));
  }

  function destroy() {
    state = 'DESTROYED';
    galaxy?.destroy();
    galaxy = null;
    element.remove();
    if (document.documentElement.dataset.page === 'work') {
      delete document.documentElement.dataset.page;
    }
  }

  return {
    prepare,
    enter,
    destroy,
    get state() { return state; },
    get active() { return state === 'ACTIVE'; },
    element,
  };
}
