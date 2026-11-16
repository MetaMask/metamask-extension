import type { AuthenticationControllerState } from '@metamask/profile-sync-controller/auth';

/**
 * Banner placement on the wallet home. Mobile's equivalent is
 * `mobile-wallet-home`.
 */
export const BRAZE_BANNER_HOME_PLACEMENT_ID = 'extension-wallet-home';

/**
 * Every banner placement the extension renders. Braze only syncs placements
 * that are requested, so a new placement must be added here.
 */
export const BRAZE_BANNER_PLACEMENT_IDS: readonly string[] = [
  BRAZE_BANNER_HOME_PLACEMENT_ID,
];

/**
 * A Braze banner, reduced to the fields the UI renders. Campaign HTML never
 * leaves the Braze host.
 *
 * Control banners (users held out of a campaign) carry no content. The UI
 * renders nothing for them but still reports the impression, so the campaign
 * can compare both groups.
 */
export type BrazeBanner = {
  id: string;
  placementId: string;
  isControl: boolean;
  title: string | null;
  /** Always present for non-control banners. */
  body: string | null;
  /** An `https` URL. */
  imageUrl: string | null;
  ctaLabel: string | null;
  /** A MetaMask universal link, or `null` for a non-interactive banner. */
  deeplink: string | null;
};

export type BrazeBannerInteraction = 'impression' | 'click' | 'dismiss';

/**
 * The Braze SDK host, as seen from the background: the offscreen client on
 * MV3, or the in-process host on MV2.
 */
export type BrazeHost = {
  /**
   * Apply the desired Braze user.
   *
   * @param profileId - The canonical profile ID, or `null` to clear.
   */
  syncUser: (profileId: string | null) => Promise<void>;
  /**
   * Get the banner for a placement. The first call for a user syncs banners
   * from Braze.
   *
   * @param placementId - The placement ID.
   */
  getBanner: (placementId: string) => Promise<BrazeBanner | null>;
  /**
   * Log an interaction with the banner currently held for a placement. Ignored
   * when that banner is no longer `bannerId`.
   *
   * @param placementId - The placement ID.
   * @param bannerId - The ID of the banner the user interacted with.
   * @param interaction - The interaction.
   */
  logBannerInteraction: (
    placementId: string,
    bannerId: string,
    interaction: BrazeBannerInteraction,
  ) => Promise<void>;
};

/**
 * Whether this build has the configuration required to activate Braze.
 * Test builds never activate Braze.
 *
 * @returns True when Braze can be initialized in this build.
 */
export function isBrazeConfigured(): boolean {
  return Boolean(
    !process.env.IN_TEST &&
    process.env.BRAZE_WEB_API_KEY &&
    process.env.BRAZE_SDK_ENDPOINT,
  );
}

/**
 * Canonical profile ID of the session belonging to the wallet's primary SRP.
 *
 * `srpSessionData` is persisted and keyed by keyring `metadata.id`. It is not
 * pruned when a keyring goes away, so its first entry can outlive the wallet it
 * was created for. Keying by the primary HD keyring — the identity Mobile uses
 * — avoids identifying a reset-away session.
 *
 * @param primaryEntropySourceId - The primary HD keyring ID. Keyrings are only
 * populated while the wallet is unlocked.
 * @param srpSessionData - The session data from `AuthenticationController`.
 * @returns The canonical profile ID, or `undefined`.
 */
export function getPrimaryCanonicalProfileId(
  primaryEntropySourceId: string | undefined,
  srpSessionData: AuthenticationControllerState['srpSessionData'],
): string | undefined {
  if (!primaryEntropySourceId) {
    return undefined;
  }

  return (
    srpSessionData?.[primaryEntropySourceId]?.profile?.canonicalProfileId ||
    undefined
  );
}

export type BrazeUserInputs = {
  completedOnboarding: boolean;
  useExternalServices: boolean;
  isSignedIn: boolean;
  isUnlocked: boolean;
  canonicalProfileId: string | undefined;
  isUiOpen: boolean;
};

/**
 * Decide which Braze user should be active.
 *
 * - `null`: Braze must not hold user data. Onboarding is incomplete (Basic
 * Functionality defaults to on before the user can choose), Basic
 * Functionality is off, or the user is signed out of Profile Sync.
 * - A profile ID: identify this user.
 * - `undefined`: no change. The wallet is locked, the profile ID is not
 * available yet, or no MetaMask UI document is open. Locking never clears
 * Braze data.
 *
 * Identifying is what starts a Braze session (`changeUser` opens one, and
 * flushing can too), and the SDK has no way to end a session early. Waiting for
 * an open UI document keeps sessions tied to actual wallet use instead of to
 * background-only service worker wakeups.
 *
 * @param inputs - The relevant wallet state.
 * @param inputs.completedOnboarding
 * @param inputs.useExternalServices
 * @param inputs.isSignedIn
 * @param inputs.isUnlocked
 * @param inputs.canonicalProfileId
 * @param inputs.isUiOpen
 * @returns The desired Braze user.
 */
export function getDesiredBrazeUser({
  completedOnboarding,
  useExternalServices,
  isSignedIn,
  isUnlocked,
  canonicalProfileId,
  isUiOpen,
}: BrazeUserInputs): string | null | undefined {
  if (!completedOnboarding || !useExternalServices || !isSignedIn) {
    return null;
  }

  if (!isUnlocked || !canonicalProfileId || !isUiOpen) {
    return undefined;
  }

  return canonicalProfileId;
}
