///: BEGIN:ONLY_INCLUDE_IF(ocap-kernel)
import browser from 'webextension-polyfill';

browser.devtools.panels.create('Kernel Panel', null, 'kernel-panel.html');
///: END:ONLY_INCLUDE_IF(ocap-kernel)
