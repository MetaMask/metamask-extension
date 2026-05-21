import { BrowserRuntimePostMessageStream } from '@metamask/post-message-stream';
import { ProxySnapExecutor } from '@metamask/snaps-execution-environments';
import { isObject } from '@metamask/utils';
import {
  OFFSCREEN_LEDGER_INIT_TIMEOUT,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';
import initLedger from './hardware-wallets/ledger';
import initTrezor from './hardware-wallets/trezor';
import initLattice from './hardware-wallets/lattice';
import initConnectivityDetection from './connectivity';
import {
  installSpeculosWebHidMock,
  type SpeculosGlobals,
} from './speculos-webhid-mock';

const SPECULOS_PORT_STORAGE_KEY = 'speculosWebSocketPort';
const SPECULOS_PORT_POLL_INTERVAL_MS = 100;
/** Brief poll on boot; Speculos E2E reloads offscreen after writing the port. */
const SPECULOS_PORT_BOOT_POLL_MS = 500;

async function waitForChromeStorageLocal(maxWaitMs = 5000): Promise<boolean> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    if (chrome.storage?.local) {
      return true;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, SPECULOS_PORT_POLL_INTERVAL_MS),
    );
  }
  return Boolean(chrome.storage?.local);
}

async function readSpeculosWebSocketPort(): Promise<number | undefined> {
  if (!chrome.storage?.local) {
    return undefined;
  }
  const result = await chrome.storage.local.get(SPECULOS_PORT_STORAGE_KEY);
  const port = result[SPECULOS_PORT_STORAGE_KEY];
  return typeof port === 'number' && port > 0 ? port : undefined;
}

/**
 * Poll storage until the E2E runner writes the ApduBridge WebSocket port.
 * The first offscreen boot often happens before that write; tests reload offscreen after setting it.
 * @param maxWaitMs
 */
async function waitForSpeculosWebSocketPort(
  maxWaitMs: number,
): Promise<number | undefined> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const port = await readSpeculosWebSocketPort();
    if (port) {
      return port;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, SPECULOS_PORT_POLL_INTERVAL_MS),
    );
  }
  return undefined;
}

/**
 * Initialize WebHID mock for Speculos E2E tests.
 * Reads the ApduBridge port from chrome.storage.local (set by the E2E runner).
 */
async function initWebHIDMockForSpeculos(): Promise<void> {
  if (!process.env.IN_TEST) {
    return;
  }

  const storageReady = await waitForChromeStorageLocal();
  if (!storageReady) {
    console.log(
      '[Offscreen] chrome.storage.local not available, skipping WebHID mock',
    );
    return;
  }

  try {
    const speculosPort =
      (await readSpeculosWebSocketPort()) ??
      (await waitForSpeculosWebSocketPort(SPECULOS_PORT_BOOT_POLL_MS));

    if (!speculosPort) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const speculosWin = window as unknown as SpeculosGlobals['win'] & {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      __speculosWS?: typeof WebSocket;
    };

    if (speculosWin.__speculosWebHIDMockInstalled) {
      return;
    }

    const WS = speculosWin.__speculosWS;
    if (!WS) {
      console.warn(
        '[Offscreen] No WebSocket constructor available for Speculos mock',
      );
      return;
    }

    installSpeculosWebHidMock(speculosPort, {
      WS,
      win: speculosWin,
      nav: navigator,
    });
    console.log(
      '[Offscreen] WebHID mock initialized for Speculos on port',
      speculosPort,
    );
  } catch (error) {
    console.error('[Offscreen] Failed to initialize WebHID mock:', error);
  }
}

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
  // Initialize WebHID mock for Speculos tests (if in test mode with speculos port configured)
  await initWebHIDMockForSpeculos();

  initializePostMessageStream();
  initTrezor();
  initLattice();

  try {
    const ledgerInitTimeout = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Ledger initialization timed out'));
      }, OFFSCREEN_LEDGER_INIT_TIMEOUT);
    });
    await Promise.race([initLedger(), ledgerInitTimeout]);
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
