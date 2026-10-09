import type { MetaMaskReduxState } from '../../store/store';
import type { ReferralMeDto } from '../../../shared/types/rewards-money';

export const selectReferralMe = (
  state: MetaMaskReduxState,
): ReferralMeDto | null => state.rewardsMoney.referralMe;

export const selectReferralMeSettled = (state: MetaMaskReduxState): boolean =>
  state.rewardsMoney.referralMeSettled;

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
