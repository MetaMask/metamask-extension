import { BrowserRuntimePostMessageStream } from '@metamask/post-message-stream';
import { ProxySnapExecutor } from '@metamask/snaps-execution-environments';
import { isObject } from '@metamask/utils';
import {
  OFFSCREEN_LEDGER_INIT_TIMEOUT,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';
import initLedger from './hardware-wallets/ledger-dmk';
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
 * Query the background for the active Ledger handler mode.
 *
 * The background's `addLedgerModeResponder` listener replies asynchronously
 * with `{mode: 'bridge' | 'legacy'}` based on the `ledgerDmkBridge` remote
 * feature flag. If the controller isn't ready yet, the query times out and
 * we fall back to `'legacy'`.
 *
 * @returns `'bridge'` if the DMK bridge handler should be used, `'legacy'` otherwise.
 */
async function getLedgerMode(): Promise<'bridge' | 'legacy'> {
  const GET_LEDGER_MODE_TIMEOUT_MS = 2000;

  try {
    const response = await new Promise<{ mode?: 'bridge' | 'legacy' }>(
      (resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('getLedgerMode timed out'));
        }, GET_LEDGER_MODE_TIMEOUT_MS);

        chrome.runtime.sendMessage(
          {
            target: OffscreenCommunicationTarget.extensionMain,
            action: 'getLedgerMode',
          },
          (response: { mode?: 'bridge' | 'legacy' }) => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(response ?? {});
          },
        );
      },
    );

    return response?.mode === 'bridge' ? 'bridge' : 'legacy';
  } catch (error) {
    console.warn(
      '[LedgerOffscreen] Failed to get Ledger mode, defaulting to legacy:',
      error,
    );
    return 'legacy';
  }
}

/**
 * Initialize the ledger, trezor, and lattice keyring connections, and the
 * post message stream for the Snaps environment.
 */
async function init(): Promise<void> {
  initializePostMessageStream();
  initTrezor();
  initLattice();

  try {
    const ledgerMode = await getLedgerMode();
    const ledgerInitTimeout = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Ledger initialization timed out'));
      }, OFFSCREEN_LEDGER_INIT_TIMEOUT);
    });
    await Promise.race([initLedger(ledgerMode), ledgerInitTimeout]);
  } catch (error) {
    console.error('Ledger initialization failed:', error);
  }
}

init().then(() => {
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

  initConnectivityDetection();
});
