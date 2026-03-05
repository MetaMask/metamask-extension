// Ocap Kernel dev tools panel
import browser from 'webextension-polyfill';

browser.devtools.panels.create(
  'MetaMask Kernel Panel',
  'images/icon-16.png',
  'devtools/ocap-kernel/kernel-panel.html',
);
