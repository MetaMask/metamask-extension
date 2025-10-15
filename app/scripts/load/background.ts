// currently only used in webpack build.

import browser from 'webextension-polyfill';
import { ExtensionLazyListener } from '../lib/extension-lazy-listener/extension-lazy-listener';

import '../background';

globalThis.stateHooks.lazyListener = new ExtensionLazyListener(browser);

if (process.env.IN_TEST) {
  // only used for testing
  document.documentElement.classList.add('metamask-loaded');
}
