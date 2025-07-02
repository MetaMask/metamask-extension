import browser from 'webextension-polyfill';

browser.devtools.panels.create(
  'Kernel Panel',
  null,
  'ocap-kernel/kernel-panel.html',
);
