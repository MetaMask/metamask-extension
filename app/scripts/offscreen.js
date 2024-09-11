import { captureException } from '@sentry/browser';
import {
  OFFSCREEN_LOAD_TIMEOUT,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';
import { getSocketBackgroundToMocha } from '../../test/e2e/background-socket/socket-background-to-mocha';

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
    if (
      error?.message?.startsWith(
        'Only a single offscreen document may be created',
      )
    ) {
      console.debug('Offscreen document already exists; skipping creation');
    } else {
      // Report unrecongized errors without halting wallet initialization
      // Failures to create the offscreen document does not compromise wallet data integrity or
      // core functionality, it's just needed for specific features.
      captureException(error);
    }
    return;
  }

  // In case we are in a bad state where the offscreen document is not loading, timeout and let execution continue.
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(resolve, OFFSCREEN_LOAD_TIMEOUT);
  });

  await Promise.race([loadPromise, timeoutPromise]);

  console.debug('Offscreen iframe loaded');
}
