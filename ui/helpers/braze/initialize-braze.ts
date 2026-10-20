import { captureException } from '../../../shared/lib/sentry';

const LOG_PREFIX = '[Braze]';

type BrazeModule = typeof import('@braze/web-sdk');

let hasInitialized = false;
let loadPromise: Promise<BrazeModule> | undefined;
let initializationPromise: Promise<boolean> | undefined;

/**
 * Dynamically import the Braze Web SDK.
 *
 * The SDK is code-split behind this dynamic import so its chunk is only
 * fetched by documents that reach the identify path (unlocked, signed in,
 * basic functionality on). Signed-out and locked documents never load it.
 *
 * @returns The Braze SDK module.
 */
export function loadBrazeSdk(): Promise<BrazeModule> {
  loadPromise ??= import('@braze/web-sdk');
  return loadPromise;
}

/**
 * Whether the Web SDK successfully initialized in this UI document.
 *
 * @returns True after a successful `initializeBraze` call in this document.
 */
export function isBrazeInitialized(): boolean {
  return hasInitialized;
}

/**
 * Clear the initialize latch after SDK teardown so the next identify can
 * initialize a new instance. Also used by tests.
 */
export function resetBrazeInitialization(): void {
  hasInitialized = false;
  initializationPromise = undefined;
}

/**
 * Reset the initialize latch. Tests only.
 */
export function resetBrazeInitializationForTesting(): void {
  resetBrazeInitialization();
}

function readNonEmptyEnv(value: string | undefined): string | undefined {
  if (typeof value !== 'string' || value.length === 0) {
    return undefined;
  }
  return value;
}

function isTestBuild(): boolean {
  return Boolean(process.env.IN_TEST);
}

/**
 * Initialize the Braze Web SDK in UI pages (popup, home tab, side panel).
 *
 * Must never be imported from the MV3 service worker — Braze does not support
 * workers. Cookies are disabled (`noCookies`) because they are unavailable in
 * extensions. In-app HTML and Font Awesome are off to stay inside MV3 CSP.
 * Push token sync is off so Braze cannot touch our existing service worker.
 *
 * The SDK module is loaded dynamically after the environment checks, so
 * documents that never identify never fetch it. Concurrent calls share one
 * initialization; a failed attempt can be retried.
 *
 * Does not call `openSession` or `automaticallyShowInAppMessages`. Session
 * policy and native message rendering are follow-up work.
 *
 * @returns Whether the SDK reported a successful initialize.
 */
export function initializeBraze(): Promise<boolean> {
  if (hasInitialized) {
    console.warn(`${LOG_PREFIX} Already initialized`);
    return Promise.resolve(true);
  }

  if (isTestBuild()) {
    console.warn(`${LOG_PREFIX} Skipping initialize: test build`);
    return Promise.resolve(false);
  }

  const apiKey = readNonEmptyEnv(process.env.BRAZE_WEB_API_KEY);
  const baseUrl = readNonEmptyEnv(process.env.BRAZE_SDK_ENDPOINT);
  if (!apiKey || !baseUrl) {
    console.warn(
      `${LOG_PREFIX} Skipping initialize: missing API key or endpoint (set BRAZE_WEB_API_KEY and BRAZE_SDK_ENDPOINT in .metamaskrc and restart yarn start)`,
    );
    return Promise.resolve(false);
  }

  initializationPromise ??= loadBrazeSdk()
    .then((braze) => {
      const appVersion =
        typeof process.env.METAMASK_VERSION === 'string'
          ? process.env.METAMASK_VERSION
          : undefined;

      const didInitialize = braze.initialize(apiKey, {
        baseUrl,
        enableLogging: Boolean(process.env.METAMASK_DEBUG),
        noCookies: true,
        doNotLoadFontAwesome: true,
        allowUserSuppliedJavascript: false,
        manageServiceWorkerExternally: true,
        disablePushTokenMaintenance: true,
        ...(appVersion ? { appVersion } : {}),
      });

      if (didInitialize) {
        hasInitialized = true;
        console.warn(`${LOG_PREFIX} SDK initialized`, { baseUrl, appVersion });
      } else {
        console.warn(`${LOG_PREFIX} initialize returned false`);
        // Clear the cache so a later call can retry the failure.
        initializationPromise = undefined;
      }

      return didInitialize;
    })
    .catch((error) => {
      // Clear the cache so a transient failure (chunk-load or network error)
      // can be retried by a later call instead of disabling Braze for the
      // rest of this document.
      initializationPromise = undefined;
      captureException(error);
      console.warn(`${LOG_PREFIX} initialize threw`, error);
      return false;
    });

  return initializationPromise;
}
