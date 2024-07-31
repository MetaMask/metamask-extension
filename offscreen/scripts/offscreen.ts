import { BrowserRuntimePostMessageStream } from '@metamask/post-message-stream';
import { ProxySnapExecutor } from '@metamask/snaps-execution-environments';
import {
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';

import initLedger from './ledger';
import initTrezor from './trezor';
import initLattice from './lattice';

initLedger();
initTrezor();
initLattice();

/**
 * Initialize a post message stream with the parent window that is initialized
 * in the metamask-controller (background/serivce worker) process. This will be
 * utilized by snaps for communication with snaps running in the offscreen
 * document.
 */
const parentStream = new BrowserRuntimePostMessageStream({
  name: 'child',
  target: 'parent',
});

ProxySnapExecutor.initialize(parentStream, './snaps/index.html');

if (process.env.IN_TEST) {
  chrome.runtime.onMessage.addListener((message) => {
    if (
      message &&
      typeof message === 'object' &&
      message.event === OffscreenCommunicationEvents.metamaskBackgroundReady &&
      message.target === OffscreenCommunicationTarget.extension
    ) {
      window.document?.documentElement?.classList?.add('controller-loaded');
    }
  });
}

chrome.runtime.sendMessage({
  target: OffscreenCommunicationTarget.extensionMain,
  isBooted: true,

  // This message is being sent from the Offscreen Document to the Service Worker.
  // The Service Worker has no way to query `navigator.webdriver`, so we send it here.
  webdriverPresent: navigator.webdriver === true,
});
