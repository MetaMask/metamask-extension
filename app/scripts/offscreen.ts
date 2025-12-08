import { captureException } from '../../shared/lib/sentry';
import {
  OFFSCREEN_LOAD_TIMEOUT,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';

/**
 * Returns whether the offscreen document already exists or not.
 *
 * See https://developer.chrome.com/docs/extensions/reference/api/offscreen#before_chrome_116_check_if_an_offscreen_document_is_open
 *
 * @returns True if the offscreen document already is has been opened, otherwise false.
 */
async function hasOffscreenDocument(): Promise<boolean> {
  const { chrome } = globalThis;
  // getContexts is only available in Chrome 116+
  const runtime = chrome.runtime as typeof chrome.runtime & {
    getContexts?: (options: { contextTypes: string[] }) => Promise<Array<{ contextType: string }>>;
    getURL?: (path: string) => string;
  };

  if (runtime.getContexts && typeof runtime.getContexts === 'function') {
    const contexts = await runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
    });
    return contexts.length > 0;
  }
  // Fallback for older Chrome versions
  const clients = (globalThis as typeof globalThis & { clients?: { matchAll: () => Promise<Array<{ url: string }>> } }).clients;
  if (clients && runtime.getURL) {
    const matchedClients = await clients.matchAll();
    const url = runtime.getURL('offscreen.html');
    return matchedClients.some((client) => client.url === url);
  }
  return false;
}

/**
 * Message listener type for offscreen document loaded event.
 */
type OffscreenDocumentLoadedListener = (
  msg: {
    target: OffscreenCommunicationTarget;
    isBooted: boolean;
    webdriverPresent?: boolean;
  },
) => void;

/**
 * Creates an offscreen document that can be used to load additional scripts
 * and iframes that can communicate with the extension through the chrome
 * runtime API. Only one offscreen document may exist, so any iframes required
 * by extension can be embedded in the offscreen.html file. See the offscreen
 * folder for more details.
 */
export async function createOffscreen(): Promise<void> {
  const { chrome } = globalThis;
  // Type assertion for Chrome extension APIs
  const chromeWithOffscreen = chrome as typeof chrome & {
    offscreen?: {
      createDocument: (options: {
        url: string;
        reasons: string[];
        justification: string;
      }) => Promise<void>;
      closeDocument: () => Promise<void>;
    };
  };

  if (!chromeWithOffscreen.offscreen) {
    return;
  }

  let offscreenDocumentLoadedListener: OffscreenDocumentLoadedListener | undefined;
  const loadPromise = new Promise<void>((resolve) => {
    offscreenDocumentLoadedListener = (msg) => {
      if (
        msg.target === OffscreenCommunicationTarget.extensionMain &&
        msg.isBooted
      ) {
        const onMessage = chrome.runtime.onMessage as unknown as {
          removeListener: (callback: OffscreenDocumentLoadedListener) => void;
        };
        onMessage.removeListener(
          offscreenDocumentLoadedListener as OffscreenDocumentLoadedListener,
        );
        resolve();

        // If the Offscreen Document sees `navigator.webdriver === true` and we are in a test environment,
        // start the SocketBackgroundToMocha.
        if (process.env.IN_TEST && msg.webdriverPresent) {
          // Use dynamic import for test code to exclude it from Browserify build
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          import('../../test/e2e/background-socket/socket-background-to-mocha').then(
            (module) => {
              module.getSocketBackgroundToMocha();
            },
          );
        }
      }
    };
    const onMessage = chrome.runtime.onMessage as unknown as {
      addListener: (callback: OffscreenDocumentLoadedListener) => void;
      removeListener: (callback: OffscreenDocumentLoadedListener) => void;
    };
    onMessage.addListener(
      offscreenDocumentLoadedListener as OffscreenDocumentLoadedListener,
    );
  });

  try {
    const offscreenExists = await hasOffscreenDocument();

    // In certain cases the offscreen document may already exist during boot, if it does, we close it and recreate it.
    if (offscreenExists) {
      // eslint-disable-next-line no-console
      console.debug('Found existing offscreen document, closing.');
      await chromeWithOffscreen.offscreen!.closeDocument();
    }

    await chromeWithOffscreen.offscreen!.createDocument({
      url: './offscreen.html',
      reasons: ['IFRAME_SCRIPTING'],
      justification:
        'Used for Hardware Wallet and Snaps scripts to communicate with the extension.',
    });
  } catch (error) {
    if (offscreenDocumentLoadedListener) {
      const onMessage = chrome.runtime.onMessage as unknown as {
        removeListener: (callback: OffscreenDocumentLoadedListener) => void;
      };
      onMessage.removeListener(
        offscreenDocumentLoadedListener as OffscreenDocumentLoadedListener,
      );
    }
    // Report unrecongized errors without halting wallet initialization
    // Failures to create the offscreen document does not compromise wallet data integrity or
    // core functionality, it's just needed for specific features.
    captureException(error);
    return;
  }

  // In case we are in a bad state where the offscreen document is not loading, timeout and let execution continue.
  const timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(resolve, OFFSCREEN_LOAD_TIMEOUT);
  });

  await Promise.race([loadPromise, timeoutPromise]);

  // eslint-disable-next-line no-console
  console.debug('Offscreen iframe loaded');
}

