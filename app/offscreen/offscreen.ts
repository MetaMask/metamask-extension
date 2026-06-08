import { BrowserRuntimePostMessageStream } from '@metamask/post-message-stream';
import { ProxySnapExecutor } from '@metamask/snaps-execution-environments';
import { isObject } from '@metamask/utils';
import {
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';
import { bootstrapLedger } from './hardware-wallets/ledger-router';
import initTrezor from './hardware-wallets/trezor';
import initLattice from './hardware-wallets/lattice';
import initConnectivityDetection from './connectivity';

/**
 * Initialize a post message stream with the parent window that is initialized
 * in the metamask-controller (background/serivce worker) process. This will be
 * utilized by snaps for communication with snaps running in the offscreen
 * document.
 */
function initializePostMessageStream() {
  const parentStream = new BrowserRuntimePostMessageStream({
    name: 'child',
    target: 'parent',
  });

  ProxySnapExecutor.initialize(parentStream, './snaps/index.html');
}

/**
 * Initialize the ledger, trezor, and lattice keyring connections, and the
 * post message stream for the Snaps environment.
 */
async function init(): Promise<void> {
  initializePostMessageStream();
  initTrezor();
  initLattice();

  // Signal that the offscreen document is booted.  The background's
  // createOffscreen() isBooted handler resolves on this message.
  // bootstrapLedger() starts the Legacy handler immediately; the
  // background pushes the correct mode (DMK or Legacy) via
  // switchLedgerMode once the controller is ready.
  chrome.runtime.sendMessage({
    target: OffscreenCommunicationTarget.extensionMain,
    isBooted: true,

    // This message is being sent from the Offscreen Document to the Service Worker.
    // The Service Worker has no way to query `navigator.webdriver`, so we send it here.
    webdriverPresent: navigator.webdriver === true,
  });

  await bootstrapLedger();

  // The background broadcasts `metamaskBackgroundReady` only after its
  // initialize() function returns, which happens after the controller is
  // built. So registering the test listener here cannot miss the event.
  if (process.env.IN_TEST) {
    chrome.runtime.onMessage.addListener((message) => {
      if (
        message &&
        isObject(message) &&
        message.event ===
          OffscreenCommunicationEvents.metamaskBackgroundReady &&
        message.target === OffscreenCommunicationTarget.extension
      ) {
        window.document?.documentElement?.classList?.add('controller-loaded');
      }
    });
  }

  initConnectivityDetection();
}

init();
