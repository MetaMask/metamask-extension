import {
  BRAZE_BANNER_PLACEMENT_IDS,
  type BrazeBanner,
  type BrazeBannerInteraction,
  type BrazeHost,
} from '../../shared/lib/braze';
import { getBrazeBannerEventProperties, toBrazeBanner } from './braze-banner';
import type { BrazeSdk, BrazeSdkBannersEvent } from './braze-sdk';

type LoadSdk = () => Promise<BrazeSdk>;

const loadBrazeSdk: LoadSdk = async () =>
  (await import(/* webpackChunkName: "braze-sdk" */ './braze-sdk')).brazeSdk;

/**
 * How long a banner request waits for the banners sync. A later sync still
 * fills the cache for the next request; the UI never shows a banner that
 * arrives after the page settled.
 */
export const BRAZE_BANNERS_REFRESH_TIMEOUT_MS = 5_000;

/**
 * Custom events logged alongside banner interactions, matching Mobile.
 */
const BANNER_CUSTOM_EVENTS: Record<BrazeBannerInteraction, string> = {
  impression: 'Banner Display',
  click: 'Banner Select',
  dismiss: 'Banner Dismissed',
};

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
 * @returns Whether the SDK user changed.
 */
function applyBrazeUser(sdk: BrazeSdk, profileId: string | null): boolean {
  if (!initializeBraze(sdk)) {
    throw new Error('Braze SDK failed to initialize');
  }

  if (profileId === null) {
    try {
      sdk.wipeData();
    } finally {
      sdk.destroy();
    }
    return true;
  }

  const userChanged = sdk.getUser()?.getUserId() !== profileId;
  if (userChanged) {
    sdk.changeUser(profileId);
  }

  // Braze defers its periodic flush while the document is hidden. The MV2
  // background page can be hidden, so flush the identity and session data now;
  // this is also harmless in the MV3 offscreen document.
  sdk.requestImmediateDataFlush();
  return userChanged;
}

/**
 * Whether a banners event ends a refresh, and whether the refresh succeeded.
 *
 * @param event - The banners event.
 * @returns `true` on success, `false` on a final failure, or `undefined`.
 */
function getRefreshOutcome(event: BrazeSdkBannersEvent): boolean | undefined {
  if (event.type === 'DATA_UPDATED') {
    return true;
  }

  // Until the SDK has its server config, banners count as disabled and the
  // SDK refreshes again once they are enabled.
  if (
    event.type === 'ERROR' &&
    event.retryState !== 'SDK_WILL_RETRY' &&
    event.reason !== 'FEATURE_DISABLED'
  ) {
    return false;
  }

  return undefined;
}

/**
 * Sync every placement and wait for the sync to finish.
 *
 * Completion is read from the banners event stream rather than the
 * `requestBannersRefresh` callbacks: a refresh requested before the SDK has
 * its server config fails immediately, and the SDK's own retry once banners
 * are enabled reports only to the event stream.
 *
 * @param sdk - The Braze SDK.
 * @returns Whether the sync succeeded. A timeout counts as success: the SDK
 * keeps trying, so requesting again would only add a request.
 */
function refreshBanners(sdk: BrazeSdk): Promise<boolean> {
  return new Promise((resolve) => {
    const cleanUps: (() => void)[] = [];
    const settle = (succeeded: boolean) => {
      cleanUps.forEach((cleanUp) => cleanUp());
      resolve(succeeded);
    };

    const timeout = setTimeout(
      () => settle(true),
      BRAZE_BANNERS_REFRESH_TIMEOUT_MS,
    );
    cleanUps.push(() => clearTimeout(timeout));

    // Events sent synchronously on subscription never end the refresh.
    const subscriptionId = sdk.subscribeToBannersEvents((event) => {
      const outcome = getRefreshOutcome(event);
      if (outcome !== undefined) {
        settle(outcome);
      }
    });
    if (subscriptionId) {
      cleanUps.push(() => sdk.removeSubscription(subscriptionId));
    }

    sdk.requestBannersRefresh([...BRAZE_BANNER_PLACEMENT_IDS]);
  });
}

/**
 * Create the Braze host. It holds the only SDK instance, applies the user the
 * background asks for, and serves banners for that user; the background owns
 * every gate.
 *
 * The host runs in the offscreen document on MV3 and in the background page on
 * MV2, where the page is a DOM context.
 *
 * Only the latest requested user is applied, so a slow first SDK load cannot
 * apply a stale request after a newer one.
 *
 * Banners are synced on the first request for each user rather than on
 * identification, so users who never see a placement (the feature flag is
 * off, for example) cause no banner requests. Later syncs are left to the SDK,
 * which refreshes requested placements on each new session.
 *
 * @param options - Options.
 * @param options.loadSdk - Loads the SDK. Defaults to a dynamic import.
 * @returns The Braze host.
 */
export function createBrazeHost({
  loadSdk = loadBrazeSdk,
}: { loadSdk?: LoadSdk } = {}): BrazeHost {
  let sdkPromise: Promise<BrazeSdk> | undefined;
  let latestProfileId: string | null = null;
  let bannersRefresh: Promise<boolean> | undefined;

  async function syncUser(profileId: string | null): Promise<void> {
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
    if (applyBrazeUser(sdk, latestProfileId)) {
      bannersRefresh = undefined;
    }
  }

  /**
   * The SDK, when it is identified as the latest requested user.
   *
   * @param profileId - The user the caller expects.
   * @returns The SDK, or `undefined`.
   */
  async function getSdkIdentifiedAs(
    profileId: string | null,
  ): Promise<BrazeSdk | undefined> {
    if (profileId === null || profileId !== latestProfileId || !sdkPromise) {
      return undefined;
    }

    const sdk = await sdkPromise;
    return sdk.isInitialized() && sdk.getUser()?.getUserId() === profileId
      ? sdk
      : undefined;
  }

  async function getBanner(placementId: string): Promise<BrazeBanner | null> {
    const profileId = latestProfileId;
    const sdk = await getSdkIdentifiedAs(profileId);
    if (!sdk) {
      return null;
    }

    bannersRefresh ??= refreshBanners(sdk);
    const refresh = bannersRefresh;
    const succeeded = await refresh;
    if (!succeeded && bannersRefresh === refresh) {
      // Let the next request try again.
      bannersRefresh = undefined;
    }

    // The user may have changed during the sync.
    if (!(await getSdkIdentifiedAs(profileId))) {
      return null;
    }
    return toBrazeBanner(sdk.getBanner(placementId));
  }

  async function logBannerInteraction(
    placementId: string,
    bannerId: string,
    interaction: BrazeBannerInteraction,
  ): Promise<void> {
    const sdk = await getSdkIdentifiedAs(latestProfileId);
    const banner = sdk?.getBanner(placementId);
    // The cache may hold a newer banner than the one the user saw.
    if (!sdk || banner?.id !== bannerId) {
      return;
    }

    switch (interaction) {
      case 'impression':
        sdk.logBannerImpressions([placementId]);
        break;
      case 'click':
        sdk.logBannerClick(banner);
        break;
      case 'dismiss':
        sdk.dismissBanner(banner);
        break;
      default:
        throw new Error(`Unknown banner interaction: ${String(interaction)}`);
    }

    const eventProperties = getBrazeBannerEventProperties(banner);
    // A control banner is not displayed, so it logs no display event.
    if (eventProperties && !banner.isControl) {
      sdk.logCustomEvent(BANNER_CUSTOM_EVENTS[interaction], eventProperties);
    }

    // See `applyBrazeUser`: the document can be hidden.
    sdk.requestImmediateDataFlush();
  }

  return { syncUser, getBanner, logBannerInteraction };
}
