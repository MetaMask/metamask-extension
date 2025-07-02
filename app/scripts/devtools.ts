import browser from 'webextension-polyfill';

browser.devtools.panels.create(
  'Kernel Panel',
  'images/icon-16.png',
  'ocap-kernel/kernel-panel.html',
);
