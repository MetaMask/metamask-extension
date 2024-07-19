import { BrowserRuntimePostMessageStream } from '@metamask/post-message-stream';
import { ProxySnapExecutor } from '@metamask/snaps-execution-environments';
import { OffscreenCommunicationTarget } from '../../shared/constants/offscreen-communication';
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

chrome.runtime.sendMessage({
  target: OffscreenCommunicationTarget.extensionMain,
  isBooted: true,

  // This message is being sent from the Offscreen Document to the Service Worker.
  // The Service Worker has no way to query `navigator.webdriver`, so we send it here.
  webdriverPresent: navigator.webdriver === true,
});
