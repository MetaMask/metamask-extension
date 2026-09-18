import * as braze from '@braze/web-sdk';
import { captureException } from '../../../shared/lib/sentry';

const LOG_PREFIX = '[Braze]';

let hasInitialized = false;

/**
 * Whether the Web SDK successfully initialized in this UI document.
 *
 * @returns True after a successful `initializeBraze` call in this document.
 */
export function isBrazeInitialized(): boolean {
  return hasInitialized;
}

/**
 * Clear the initialize latch. Used after `wipeData` so the next identify can
 * re-initialize, and by tests.
 */
export function resetBrazeInitialization(): void {
  hasInitialized = false;
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
 * Does not call `openSession` or `automaticallyShowInAppMessages`. Session
 * policy and native message rendering are follow-up work.
 *
 * @returns Whether the SDK reported a successful initialize.
 */
export function initializeBraze(): boolean {
  if (hasInitialized) {
    console.warn(`${LOG_PREFIX} Already initialized`);
    return true;
  }

  if (isTestBuild()) {
    console.warn(`${LOG_PREFIX} Skipping initialize: test build`);
    return false;
  }

  const apiKey = readNonEmptyEnv(process.env.BRAZE_WEB_API_KEY);
  const baseUrl = readNonEmptyEnv(process.env.BRAZE_SDK_ENDPOINT);
  if (!apiKey || !baseUrl) {
    console.warn(
      `${LOG_PREFIX} Skipping initialize: missing API key or endpoint (set BRAZE_WEB_API_KEY and BRAZE_SDK_ENDPOINT in .metamaskrc and restart yarn start)`,
    );
    return false;
  }

  try {
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
    }

    return didInitialize;
  } catch (error) {
    captureException(error);
    console.warn(`${LOG_PREFIX} initialize threw`, error);
    return false;
  }
}
