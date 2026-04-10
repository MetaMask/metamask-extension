// currently only used in webpack build.

async function loadUi() {
  await globalThis.stateHooks.runtimeInitialization;
  // NodeNext TypeScript requires the emitted `.js` specifier here.
  // eslint-disable-next-line import-x/extensions
  await import('../ui.js');

  if (process.env.IN_TEST) {
    // only used for testing
    document.documentElement.classList.add('metamask-loaded');
  }
}

loadUi();

export {};
