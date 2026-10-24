import {
  BrazeAction,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';
import { isBrazeConfigured } from '../../shared/lib/braze';
import { captureException } from '../../shared/lib/sentry';
import type {
  BrazeSyncUserMessage,
  BrazeSyncUserResponse,
} from '../scripts/services/braze-service';
import type { BrazeSdk } from './braze-sdk';

type LoadSdk = () => Promise<BrazeSdk>;

const loadBrazeSdk: LoadSdk = async () =>
  (await import(/* webpackChunkName: "braze-sdk" */ './braze-sdk')).brazeSdk;

/**
 * Initialize Braze with options that keep it inside the extension's limits.
 *
 * @param sdk - The Braze SDK.
 * @returns Whether the SDK is initialized.
 */
function initializeBraze(sdk: BrazeSdk): boolean {
  return (
    sdk.isInitialized() ||
    sdk.initialize(process.env.BRAZE_WEB_API_KEY as string, {
      baseUrl: process.env.BRAZE_SDK_ENDPOINT as string,
      enableLogging: Boolean(process.env.METAMASK_DEBUG),
      // Extension pages cannot use cookies.
      noCookies: true,
      doNotLoadFontAwesome: true,
      allowUserSuppliedJavascript: false,
      // Leave the extension's service worker and push subscription alone.
      manageServiceWorkerExternally: true,
      disablePushTokenMaintenance: true,
      appVersion: process.env.METAMASK_VERSION,
    })
  );
}

/**
 * Whether Braze has persisted data in this extension's `localStorage`.
 *
 * @returns True when a Braze storage key exists.
 */
function hasPersistedBrazeData(): boolean {
  return Object.keys(localStorage).some((key) => key.startsWith('ab.'));
}

/**
 * Make the SDK match the desired user.
 *
 * Identifying calls `changeUser` only when the ID differs; a changed ID starts
 * a session. Clearing wipes local data before destroying the SDK, because
 * destroying flushes queued data. The SDK must be initialized to wipe; doing
 * so sends no requests.
 *
 * @param sdk - The Braze SDK.
 * @param profileId - The canonical profile ID, or `null` to clear.
 */
function applyBrazeUser(sdk: BrazeSdk, profileId: string | null): void {
  if (!initializeBraze(sdk)) {
    throw new Error('Braze SDK failed to initialize');
  }

  if (profileId === null) {
    try {
      sdk.wipeData();
    } finally {
      sdk.destroy();
    }
    return;
  }

  if (sdk.getUser()?.getUserId() !== profileId) {
    sdk.changeUser(profileId);
  }
}

/**
 * Create the offscreen Braze host. It holds the only SDK instance and applies
 * the user the background asks for; the background owns every gate.
 *
 * Only the latest requested user is applied, so a slow first SDK load cannot
 * apply a stale request after a newer one.
 *
 * @param options - Options.
 * @param options.loadSdk - Loads the SDK. Defaults to a dynamic import.
 * @returns A function that applies the desired user.
 */
export function createBrazeHost({
  loadSdk = loadBrazeSdk,
}: { loadSdk?: LoadSdk } = {}) {
  let sdkPromise: Promise<BrazeSdk> | undefined;
  let latestProfileId: string | null = null;

  return async function syncBrazeUser(profileId: string | null) {
    latestProfileId = profileId;

    // Clearing a document that never used Braze must not load the SDK.
    if (profileId === null && !sdkPromise && !hasPersistedBrazeData()) {
      return;
    }

    sdkPromise ??= loadSdk().catch((error: unknown) => {
      sdkPromise = undefined;
      throw error;
    });
    const sdk = await sdkPromise;

    if (
      latestProfileId === null &&
      !sdk.isInitialized() &&
      !hasPersistedBrazeData()
    ) {
      return;
    }
    applyBrazeUser(sdk, latestProfileId);
  };
}

/**
 * Whether a message was sent by this extension's service worker.
 *
 * Offscreen documents only expose part of `chrome.runtime` (no `getManifest`,
 * for example), so the sender is identified by its fields: the service worker
 * has no tab and no document, while extension pages have a `documentId` and
 * tabs also have `tab`.
 *
 * @param sender - The message sender.
 * @returns True for the background service worker.
 */
function isFromServiceWorker(sender: chrome.runtime.MessageSender): boolean {
  return (
    sender.id === chrome.runtime.id &&
    sender.documentId === undefined &&
    sender.tab === undefined
  );
}

/**
 * Listen for Braze user updates from the background. Does nothing in builds
 * without Braze configuration.
 *
 * Never throws, so a Braze failure cannot prevent the rest of the offscreen
 * document (hardware wallets, Snaps) from initializing.
 */
export default function initBraze(): void {
  if (!isBrazeConfigured()) {
    return;
  }

  try {
    registerBrazeHost();
  } catch (error) {
    console.error('Braze initialization failed:', error);
  }
}

/**
 * Register the offscreen listener that applies Braze user updates.
 */
function registerBrazeHost(): void {
  const syncBrazeUser = createBrazeHost();

  chrome.runtime.onMessage.addListener(
    (
      message: Partial<BrazeSyncUserMessage>,
      sender,
      sendResponse: (response: BrazeSyncUserResponse) => void,
    ) => {
      if (
        message?.target !== OffscreenCommunicationTarget.brazeOffscreen ||
        message.action !== BrazeAction.syncUser ||
        !isFromServiceWorker(sender)
      ) {
        return false;
      }

      const profileId =
        typeof message.profileId === 'string' && message.profileId
          ? message.profileId
          : null;

      syncBrazeUser(profileId)
        .then(() => sendResponse({ success: true }))
        .catch((error: unknown) => {
          captureException(error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      return true;
    },
  );
}
