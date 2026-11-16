import type { SyncBrazeUser } from '../../shared/lib/braze';
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
      // Never let the SDK register a service worker or manage push.
      manageServiceWorkerExternally: true,
      disablePushTokenMaintenance: true,
      appVersion: process.env.METAMASK_VERSION,
    })
  );
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

  // Flush identity and session data now rather than waiting for the SDK timer.
  sdk.requestImmediateDataFlush();
}

/**
 * Hold the SDK instance inside the dedicated worker. The document host sends
 * identities through a structured-clone channel; the background owns every gate.
 *
 * Only the latest requested user is applied, so a slow first SDK load cannot
 * apply a stale request after a newer one.
 *
 * @param options - Options.
 * @param options.loadSdk - Loads the SDK. Defaults to a dynamic import.
 * @returns A function that applies the desired user.
 */
export function createBrazeSdkHost({
  loadSdk = loadBrazeSdk,
}: { loadSdk?: LoadSdk } = {}): SyncBrazeUser {
  let sdkPromise: Promise<BrazeSdk> | undefined;
  let latestProfileId: string | null = null;

  return async function syncBrazeUser(profileId: string | null): Promise<void> {
    latestProfileId = profileId;

    // Braze keeps no state outside this document (the SDK is not granted
    // `localStorage`), so a host that never loaded the SDK has nothing to
    // clear, and loading it would create a user and a session just to wipe it.
    if (profileId === null && !sdkPromise) {
      return;
    }

    sdkPromise ??= loadSdk().catch((error: unknown) => {
      sdkPromise = undefined;
      throw error;
    });
    const sdk = await sdkPromise;

    if (latestProfileId === null && !sdk.isInitialized()) {
      return;
    }
    applyBrazeUser(sdk, latestProfileId);
  };
}
