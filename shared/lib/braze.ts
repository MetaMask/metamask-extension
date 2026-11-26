import type { AuthenticationControllerState } from '@metamask/profile-sync-controller/auth';

/**
 * What to do with the Braze identity.
 *
 * - `identify`: identify this profile ID, with the language chosen in
 * MetaMask when known.
 * - `clear`: Braze must not hold user data, so clear all of it.
 * - `keep`: leave the current Braze identity and data as they are.
 */
export type BrazeIdentityAction =
  | { type: 'identify'; profileId: string; language: string | undefined }
  | { type: 'clear' }
  | { type: 'keep' };

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

/**
 * MetaMask locales whose language part is not their ISO 639-1 code.
 */
const ISO_639_1_LANGUAGES: Record<string, string> = {
  hn: 'hi',
};

/**
 * The Braze user language for a MetaMask locale. Braze expects an ISO 639-1
 * code, so the region is dropped: `pt_BR` and `pt_PT` are both `pt`.
 *
 * @param locale - The MetaMask locale, such as `en` or `pt_BR`.
 * @returns The ISO 639-1 code, or `undefined` if the locale has none.
 */
export function getBrazeLanguage(locale: string): string | undefined {
  const [language] = locale.split('_');
  const code = ISO_639_1_LANGUAGES[language] ?? language;
  return /^[a-z]{2}$/u.test(code) ? code : undefined;
}

export type BrazeIdentityInputs = {
  completedOnboarding: boolean;
  useExternalServices: boolean;
  hasAnalyticsConsent: boolean;
  hasMarketingConsent: boolean;
  isUnlocked: boolean;
  canonicalProfileId: string | undefined;
  language: string | undefined;
  isUiOpen: boolean;
};

/**
 * Decide what to do with the Braze identity.
 *
 * - `clear`: onboarding is incomplete (Basic Functionality defaults to on
 * before the user can choose), Basic Functionality is off, or both MetaMetrics
 * and marketing consents are off.
 * - `keep`: the wallet is locked, auto sign-in has not completed yet, the
 * profile ID is unavailable, or no MetaMask UI document is open.
 * - `identify`: every gate passes.
 *
 * @param inputs - The relevant wallet state.
 * @param inputs.completedOnboarding
 * @param inputs.useExternalServices
 * @param inputs.hasAnalyticsConsent
 * @param inputs.hasMarketingConsent
 * @param inputs.isUnlocked
 * @param inputs.canonicalProfileId
 * @param inputs.language
 * @param inputs.isUiOpen
 * @returns The Braze identity action.
 */
export function getBrazeIdentityAction({
  completedOnboarding,
  useExternalServices,
  hasAnalyticsConsent,
  hasMarketingConsent,
  isUnlocked,
  canonicalProfileId,
  language,
  isUiOpen,
}: BrazeIdentityInputs): BrazeIdentityAction {
  if (
    !completedOnboarding ||
    !useExternalServices ||
    (!hasAnalyticsConsent && !hasMarketingConsent)
  ) {
    return { type: 'clear' };
  }

  if (!isUnlocked || !canonicalProfileId || !isUiOpen) {
    return { type: 'keep' };
  }

  return { type: 'identify', profileId: canonicalProfileId, language };
}
