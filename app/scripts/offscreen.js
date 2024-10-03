import { captureException } from '@sentry/browser';
import {
  OFFSCREEN_LOAD_TIMEOUT,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';
import { getSocketBackgroundToMocha } from '../../test/e2e/background-socket/socket-background-to-mocha';

/**
 * Returns whether the offscreen document already exists or not.
 *
 * See https://developer.chrome.com/docs/extensions/reference/api/offscreen#before_chrome_116_check_if_an_offscreen_document_is_open
 *
 * @returns True if the offscreen document already is has been opened, otherwise false.
 */
async function hasOffscreenDocument() {
  const { chrome, clients } = globalThis;
  // getContexts is only available in Chrome 116+
  if ('getContexts' in chrome.runtime) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
    });
    return contexts.length > 0;
  }
  const matchedClients = await clients.matchAll();
  return matchedClients.some(
    (client) =>
      client.url.includes(chrome.runtime.id) &&
      client.url.endsWith('offscreen.html'),
  );
}

/**
 * Creates an offscreen document that can be used to load additional scripts
 * and iframes that can communicate with the extension through the chrome
 * runtime API. Only one offscreen document may exist, so any iframes required
 * by extension can be embedded in the offscreen.html file. See the offscreen
 * folder for more details.
 */
export async function createOffscreen() {
  const { chrome } = globalThis;
  if (!chrome.offscreen) {
    return;
  }

  let offscreenDocumentLoadedListener;
  const loadPromise = new Promise((resolve) => {
    offscreenDocumentLoadedListener = (msg) => {
      if (
        msg.target === OffscreenCommunicationTarget.extensionMain &&
        msg.isBooted
      ) {
        chrome.runtime.onMessage.removeListener(
          offscreenDocumentLoadedListener,
        );
        resolve();

        // If the Offscreen Document sees `navigator.webdriver === true` and we are in a test environment,
        // start the SocketBackgroundToMocha.
        if (process.env.IN_TEST && msg.webdriverPresent) {
          getSocketBackgroundToMocha();
        }
      }
    };
    chrome.runtime.onMessage.addListener(offscreenDocumentLoadedListener);
  });

  try {
    const offscreenExists = await hasOffscreenDocument();

    // In certain cases the offscreen document may already exist during boot, if it does, we close it and recreate it.
    if (offscreenExists) {
      console.debug('Found existing offscreen document, closing.');
      await chrome.offscreen.closeDocument();
    }

    await chrome.offscreen.createDocument({
      url: './offscreen.html',
      reasons: ['IFRAME_SCRIPTING'],
      justification:
        'Used for Hardware Wallet and Snaps scripts to communicate with the extension.',
    });
  } catch (error) {
    if (offscreenDocumentLoadedListener) {
      chrome.runtime.onMessage.removeListener(offscreenDocumentLoadedListener);
    }
    // Report unrecongized errors without halting wallet initialization
    // Failures to create the offscreen document does not compromise wallet data integrity or
    // core functionality, it's just needed for specific features.
    captureException(error);
    return;
  }

  // In case we are in a bad state where the offscreen document is not loading, timeout and let execution continue.
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(resolve, OFFSCREEN_LOAD_TIMEOUT);
  });

  await Promise.race([loadPromise, timeoutPromise]);

  console.debug('Offscreen iframe loaded');
}
