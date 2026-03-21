import { isObject } from '@metamask/utils';
import {
  OFFSCREEN_LEDGER_INIT_TIMEOUT,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';

/**
 * Initialize a post message stream with the parent window that is initialized
 * in the metamask-controller (background/serivce worker) process. This will be
 * utilized by snaps for communication with snaps running in the offscreen
 * document.
 */
async function initializePostMessageStream() {
  const [{ BrowserRuntimePostMessageStream }, { ProxySnapExecutor }] =
    await Promise.all([
      import('@metamask/post-message-stream'),
      import('@metamask/snaps-execution-environments'),
    ]);

  const parentStream = new BrowserRuntimePostMessageStream({
    name: 'child',
    target: 'parent',
  });

  ProxySnapExecutor.initialize(parentStream, './snaps/index.html');
}

async function initializeTrezor() {
  const { default: initTrezor } = await import('./hardware-wallets/trezor');
  initTrezor();
}

async function initializeLattice() {
  const { default: initLattice } = await import('./hardware-wallets/lattice');
  initLattice();
}

async function initializeLedger() {
  const { default: initLedger } = await import('./hardware-wallets/ledger');
  await initLedger();
}

async function initializeConnectivityDetection() {
  const { default: initConnectivityDetection } = await import('./connectivity');
  initConnectivityDetection();
}

/**
 * Initialize the ledger, trezor, and lattice keyring connections, and the
 * post message stream for the Snaps environment.
 */
async function init(): Promise<void> {
  await initializePostMessageStream();
  await initializeTrezor();
  await initializeLattice();

  try {
    const ledgerInitTimeout = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Ledger initialization timed out'));
      }, OFFSCREEN_LEDGER_INIT_TIMEOUT);
    });
    await Promise.race([initializeLedger(), ledgerInitTimeout]);
  } catch (error) {
    console.error('Ledger initialization failed:', error);
  }
}

init()
  .then(() => {
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

    chrome.runtime.sendMessage({
      target: OffscreenCommunicationTarget.extensionMain,
      isBooted: true,

      // This message is being sent from the Offscreen Document to the Service Worker.
      // The Service Worker has no way to query `navigator.webdriver`, so we send it here.
      webdriverPresent: navigator.webdriver === true,
    });

    initializeConnectivityDetection().catch((error) => {
      console.error('Offscreen connectivity initialization failed:', error);
    });
  })
  .catch((error) => {
    console.error('Offscreen initialization failed:', error);
  });
