// currently only used in webpack build.

import './_initialize';
import '../ui';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
if (process.env.IN_TEST) {
  // only used for testing
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  document.documentElement.classList.add('metamask-loaded');
}
