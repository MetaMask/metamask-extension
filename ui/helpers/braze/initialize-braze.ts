import * as braze from '@braze/web-sdk';
import { captureException } from '../../../shared/lib/sentry';

let hasInitialized = false;

/**
 * Reset the initialize latch. Tests only.
 */
export function resetBrazeInitializationForTesting(): void {
  hasInitialized = false;
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
    return true;
  }

  if (isTestBuild()) {
    return false;
  }

  const apiKey = readNonEmptyEnv(process.env.BRAZE_WEB_API_KEY);
  const baseUrl = readNonEmptyEnv(process.env.BRAZE_SDK_ENDPOINT);
  if (!apiKey || !baseUrl) {
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
    }

    return didInitialize;
  } catch (error) {
    captureException(error);
    return false;
  }
}
