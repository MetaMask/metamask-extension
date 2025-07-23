///: BEGIN:ONLY_INCLUDE_IF(ocap-kernel)
import browser from 'webextension-polyfill';

browser.devtools.panels.create(
  'MetaMask Kernel Panel',
  'images/icon-16.png',
  'devtools/ocap-kernel/kernel-panel.html',
);
///: END:ONLY_INCLUDE_IF(ocap-kernel)
