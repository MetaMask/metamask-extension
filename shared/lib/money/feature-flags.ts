import { isObject } from '@metamask/utils';
import { validatedVersionGatedFeatureFlag } from '../remote-feature-flag-utils';

/**
 * The LaunchDarkly flag that gates the Money Account surface. The same flag
 * name and shape mobile reads in `app/lib/Money/feature-flags.ts`, so the two
 * clients turn on and off together.
 */
export const MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME = 'moneyEnableMoneyAccount';

/**
 * The LaunchDarkly flag listing ISO country codes that must not be offered
 * Money Account. Same name and `{ blockedRegions }` shape as mobile.
 */
export const MONEY_ACCOUNT_GEO_BLOCKED_COUNTRIES_FLAG_NAME =
  'moneyAccountGeoBlockedCountries';

/**
 * Blocked countries used when the remote geo flag is absent or malformed.
 * Matches mobile's `DEFAULT_MONEY_ACCOUNT_BLOCKED_COUNTRIES`.
 */
export const DEFAULT_MONEY_ACCOUNT_BLOCKED_COUNTRIES = ['GB'];

/**
 * Sentinel returned by GeolocationController when the location is not yet
 * determined or the API returned an invalid response.
 */
const UNKNOWN_LOCATION = 'UNKNOWN';

/**
 * The LaunchDarkly flag that gates the realized Earnings section on Money
 * Home.
 */
export const MONEY_EARNING_SECTION_ENABLED_FLAG_NAME =
  'earnMoneyEarningSectionEnabled';

/**
 * Whether the Money Account feature is enabled.
 *
 * The flag is version-gated, so an absent, malformed, or below-minimum-version
 * value means "off" — the surface stays hidden rather than defaulting on.
 *
 * @param remoteFeatureFlags - The remote feature flags.
 * @returns Whether the Money Account feature is enabled.
 */
export function isMoneyAccountEnabled(
  remoteFeatureFlags: Record<string, unknown> | undefined,
): boolean {
  return (
    validatedVersionGatedFeatureFlag(
      remoteFeatureFlags?.[MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME],
    ) ?? false
  );
}

/**
 * The geo-blocked countries for Money Account from remote config, or the
 * local fallback when the flag is unserved or malformed.
 *
 * An empty remote `blockedRegions` array is valid and means nobody is
 * blocked. Only a missing or non-array value falls back to
 * {@link DEFAULT_MONEY_ACCOUNT_BLOCKED_COUNTRIES}.
 *
 * @param remoteFeatureFlags - The remote feature flags.
 * @returns ISO country codes that must not be offered Money Account.
 */
export function getMoneyAccountGeoBlockedCountries(
  remoteFeatureFlags: Record<string, unknown> | undefined,
): string[] {
  const remoteFlag =
    remoteFeatureFlags?.[MONEY_ACCOUNT_GEO_BLOCKED_COUNTRIES_FLAG_NAME];

  if (
    isObject(remoteFlag) &&
    Array.isArray(remoteFlag.blockedRegions) &&
    remoteFlag.blockedRegions.every(
      (region): region is string => typeof region === 'string',
    )
  ) {
    return remoteFlag.blockedRegions;
  }

  return DEFAULT_MONEY_ACCOUNT_BLOCKED_COUNTRIES;
}

/**
 * Whether the user's detected region is allowed to see Money Account.
 *
 * Defaults to blocking when geolocation is unknown so a failed or pending
 * lookup cannot bypass a blocked region. Matching uses the country segment
 * only (`"US-TX"` → `"US"`) and case-insensitive `startsWith`, so `"GB"`
 * also blocks `"GB-ENG"`. An empty blocked list means nobody is blocked.
 *
 * @param location - GeolocationController country/region code, or `UNKNOWN`.
 * @param blockedCountries - ISO country codes from
 * {@link getMoneyAccountGeoBlockedCountries}.
 * @returns Whether the user is geo-eligible for Money Account.
 */
export function isMoneyAccountGeoEligible(
  location: string | undefined | null,
  blockedCountries: string[],
): boolean {
  if (!location || location === UNKNOWN_LOCATION) {
    return false;
  }

  const userCountry = location.toUpperCase().split('-')[0];
  if (!userCountry) {
    return false;
  }

  if (blockedCountries.length === 0) {
    return true;
  }

  return blockedCountries.every(
    (blocked) => !userCountry.startsWith(blocked.toUpperCase()),
  );
}

/**
 * Whether the realized Earnings section on Money Home is enabled.
 *
 * The flag is version-gated and fails closed when absent, malformed, or below
 * the current extension version.
 *
 * @param remoteFeatureFlags - The remote feature flags.
 * @returns Whether the Earnings section is enabled.
 */
export function isMoneyEarningSectionEnabled(
  remoteFeatureFlags: Record<string, unknown> | undefined,
): boolean {
  return (
    validatedVersionGatedFeatureFlag(
      remoteFeatureFlags?.[MONEY_EARNING_SECTION_ENABLED_FLAG_NAME],
    ) ?? false
  );
}
