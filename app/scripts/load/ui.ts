// currently only used in webpack build.

import '../ui';

if (process.env.IN_TEST) {
  // only used for testing
  document.documentElement.classList.add('metamask-loaded');
}
