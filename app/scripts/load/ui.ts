// currently only used in webpack build.

import './_initialize';
import '../ui';

if (process.env.IN_TEST) {
  // only used for testing
  document.documentElement.classList.add('metamask-loaded');
}

setTimeout(() => {
  console.log(
    'UI loaded in',
    performance.timing.loadEventEnd - performance.timing.navigationStart,
    'ms',
  );
}, 100);
