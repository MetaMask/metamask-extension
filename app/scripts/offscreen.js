import { captureException } from '../../shared/lib/sentry';
import {
  OFFSCREEN_LOAD_TIMEOUT,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';

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
  const url = chrome.runtime.getURL('offscreen.html');
  return matchedClients.some((client) => client.url === url);
}

/**
 * Session storage key for tracking offscreen document creation.
 */
const OFFSCREEN_CREATION_KEY = 'offscreenCreationInProgress';

/**
 * Maximum time to wait for an in-progress offscreen creation (10 seconds).
 */
const MAX_CREATION_WAIT_TIME = 10000;

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

  // Check if another instance is already creating the offscreen document
  const sessionData = await chrome.storage.session.get([
    OFFSCREEN_CREATION_KEY,
  ]);
  const creationInProgress = sessionData?.[OFFSCREEN_CREATION_KEY];

  if (creationInProgress) {
    const creationTimestamp = creationInProgress.timestamp;
    const elapsedTime = Date.now() - creationTimestamp;

    // If creation was started recently, wait for it to complete
    if (elapsedTime < MAX_CREATION_WAIT_TIME) {
      console.debug(
        'Offscreen document creation already in progress, waiting...',
      );

      // Wait for the existing document to be ready by checking periodically
      const checkInterval = 500;
      const maxAttempts = Math.ceil(
        (MAX_CREATION_WAIT_TIME - elapsedTime) / checkInterval,
      );

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));

        const exists = await hasOffscreenDocument();
        if (exists) {
          console.debug('Existing offscreen document creation completed');
          return;
        }
      }

      // If we got here, the previous creation attempt may have failed
      // Clear the flag and continue with creation
      await chrome.storage.session.remove(OFFSCREEN_CREATION_KEY);
    } else {
      // Creation started too long ago, likely stale - clear and continue
      await chrome.storage.session.remove(OFFSCREEN_CREATION_KEY);
    }
  }

  // Set flag indicating creation is in progress
  await chrome.storage.session.set({
    [OFFSCREEN_CREATION_KEY]: { timestamp: Date.now() },
  });

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
          const { getSocketBackgroundToMocha } =
            // Use `require` to make it easier to exclude this test code from the Browserify build.
            // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, node/global-require
            require('../../test/e2e/background-socket/socket-background-to-mocha');
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

      // Wait a bit for the close operation to complete
      await new Promise((resolve) => setTimeout(resolve, 100));
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

    // Clear the creation flag on error
    await chrome.storage.session.remove(OFFSCREEN_CREATION_KEY);

    // Handle the specific "Only a single offscreen document may be created" error
    // This is expected when service worker restarts during creation, not a real error
    if (
      error.message?.includes('Only a single offscreen document may be created')
    ) {
      console.debug(
        'Offscreen document already exists (race condition during creation), waiting for it to load...',
      );

      // Wait for the existing document to be ready
      const checkInterval = 500;
      const maxAttempts = Math.ceil(MAX_CREATION_WAIT_TIME / checkInterval);

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));

        const exists = await hasOffscreenDocument();
        if (exists) {
          console.debug('Existing offscreen document is ready');
          // Re-add the load listener to catch the boot message
          chrome.runtime.onMessage.addListener(offscreenDocumentLoadedListener);
          break;
        }
      }

      return;
    }

    // Report unrecognized errors without halting wallet initialization
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

  // Clear the creation flag once loading is complete
  await chrome.storage.session.remove(OFFSCREEN_CREATION_KEY);

  console.debug('Offscreen iframe loaded');
}

/**
 * Sets up a listener for connectivity status messages from the offscreen document.
 *
 * **Note:** This function is only used in Manifest V3 (MV3). In Manifest V2 (MV2),
 * connectivity status is detected using window event listeners in the background page.
 * The function will return early if `chrome.offscreen` is not available.
 *
 * @param {Function} onConnectivityChange - Callback to invoke with the connectivity status.
 * The callback receives a boolean indicating whether the device is online.
 */
export function addOffscreenConnectivityListener(onConnectivityChange) {
  const { chrome } = globalThis;
  if (!chrome.offscreen) {
    return;
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (
      message &&
      message.target === OffscreenCommunicationTarget.extensionMain &&
      message.event === OffscreenCommunicationEvents.connectivityChange
    ) {
      onConnectivityChange(message.isOnline);
    }
  });
}
