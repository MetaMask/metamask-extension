import { initialize, isInitialized } from '@braze/web-sdk';
import { captureException } from '../../../shared/lib/sentry';

/**
 * Initialize Braze in a UI document after the identity/consent gates pass.
 * Never import this module from the background service worker: Braze needs a DOM.
 *
 * @returns Whether the SDK initialized successfully.
 */
export function initializeBraze(): boolean {
  const apiKey = process.env.BRAZE_WEB_API_KEY;
  const baseUrl = process.env.BRAZE_SDK_ENDPOINT;
  if (process.env.IN_TEST || !apiKey || !baseUrl) {
    return false;
  }

  try {
    return (
      isInitialized() ||
      initialize(apiKey, {
        baseUrl,
        enableLogging: Boolean(process.env.METAMASK_DEBUG),
        // Extension pages cannot use cookies.
        noCookies: true,
        doNotLoadFontAwesome: true,
        allowUserSuppliedJavascript: false,
        // Leave the extension's existing push service worker alone.
        manageServiceWorkerExternally: true,
        disablePushTokenMaintenance: true,
        appVersion: process.env.METAMASK_VERSION,
      })
    );
  } catch (error) {
    captureException(error);
    return false;
  }
}
