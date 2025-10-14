// currently only used in webpack build.

import { ExtensionLazyListener } from '../lib/extension-lazy-listener/extension-lazy-listener';

globalThis.stateHooks.lazyListener = new ExtensionLazyListener();

import '../background';

if (process.env.IN_TEST) {
  // only used for testing
  document.documentElement.classList.add('metamask-loaded');
}
