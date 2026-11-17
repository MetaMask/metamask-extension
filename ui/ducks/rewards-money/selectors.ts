import { getRemoteFeatureFlags } from '#shared/lib/selectors/remote-feature-flags';
import {
  validatedVersionGatedFeatureFlag,
  type VersionGatedFeatureFlag,
} from '#shared/lib/feature-flags/version-gating';
import type { MetaMaskReduxState } from '../../store/store';
import type { ReferralMeDto } from '../../../shared/types/rewards-money';

export const selectReferralMe = (
  state: MetaMaskReduxState,
): ReferralMeDto | null => state.rewardsMoney.referralMe;

export const selectReferralMeSettled = (state: MetaMaskReduxState): boolean =>
  state.rewardsMoney.referralMeSettled;

/**
 * Local gates that let a pending Money referral invite open: Basic
 * Functionality and the version-gated `rewardsMoneyControllerEnabled` flag.
 * Account eligibility (existing referrer or referee, excluded region) needs a
 * server read and is not part of this check.
 *
 * The deep-link interstitial reads the same gates, so its referral copy is
 * never shown when this client cannot open the invite at all.
 *
 * @param state - The Redux state.
 * @returns Whether the local gates allow the invite.
 */
export function selectIsMoneyReferralInviteEnabled(
  state: MetaMaskReduxState,
): boolean {
  const enabled = validatedVersionGatedFeatureFlag(
    getRemoteFeatureFlags(state).rewardsMoneyControllerEnabled as
      | VersionGatedFeatureFlag
      | undefined,
  );
  return Boolean(state.metamask.useExternalServices) && enabled === true;
}

/**
 * A plain user and a cashback-experiment member can still accept an invite.
 * A referrer or an existing referee cannot. `ui_variant` does not decide this:
 * a cashback experiment is `REFEREE` on the screen and still eligible.
 *
 * @param referralMe - The settled referral-me payload, when one exists.
 * @returns Whether this profile may still accept an invite.
 */
export function canAcceptMoneyReferralInvite(
  referralMe: Pick<ReferralMeDto, 'roles'> | null | undefined,
): boolean {
  const roles = referralMe?.roles ?? [];
  return !roles.includes('REFERRER') && !roles.includes('REFEREE');
}

/**
 * Country prefix from a geolocation string (`US-CA` → `US`).
 * Returns null for unknown locations so callers can fail open.
 *
 * @param geoLocation - Device geo from the rewards metadata, such as `US-CA`.
 * @returns The country code, or null when geo is unknown.
 */
function countryCodeFromGeoLocation(
  geoLocation: string | null | undefined,
): string | null {
  if (!geoLocation) {
    return null;
  }
  const trimmed = geoLocation.trim().toUpperCase();
  if (!trimmed || trimmed === 'UNKNOWN') {
    return null;
  }
  const [country] = trimmed.split('-');
  return country || null;
}

/**
 * Whether the current device country may accept a Money referral invite.
 * Joins the rewards geo location with controller `excludedRegions`.
 * Onboarding can read this later without mounting the invite sheet.
 *
 * Fail-open when geo is unknown, exclusions have not been published
 * (`null`), or the list is empty. A confirmed country on the list is refused.
 *
 * @param state - The Redux state.
 * @returns Whether accept is allowed.
 */
export function selectMoneyReferralAllowedForGeo(
  state: MetaMaskReduxState,
): boolean {
  const country = countryCodeFromGeoLocation(state.rewards?.geoLocation);
  const { excludedRegions } = state.metamask;
  if (!country || excludedRegions === null || excludedRegions === undefined) {
    return true;
  }
  if (excludedRegions.length === 0) {
    return true;
  }
  const excluded = new Set(
    excludedRegions.map((code) => code.trim().toUpperCase()),
  );
  return !excluded.has(country);
}
