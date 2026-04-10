// currently only used in webpack build.

async function loadUi() {
  await globalThis.stateHooks.runtimeInitialization;
  await import('../ui');

  if (process.env.IN_TEST) {
    // only used for testing
    document.documentElement.classList.add('metamask-loaded');
  }
}

loadUi();

export {};
