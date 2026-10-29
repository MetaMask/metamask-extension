import type { Country, UserRegion } from '@metamask/ramps-controller';

/**
 * Returns true only when the user's region is *definitively* unsupported for
 * buy. Any indeterminate input (null region, missing flags with empty country
 * list) returns false — fail-open, never block on uncertainty.
 * @param userRegion - The user's geolocation region data, or null if not resolved.
 * @param countries - The list of supported countries.
 * @returns True if the region is definitively unsupported for buy; false otherwise.
 */
export function isRampRegionDefinitivelyUnsupported(
  userRegion: UserRegion | null,
  countries: Country[],
): boolean {
  if (!userRegion) {
    return false; // geolocation not resolved => don't block here
  }

  // 1. Explicit US state buy flag wins.
  const stateBuy = userRegion.state?.supported?.buy;
  if (typeof stateBuy === 'boolean') {
    return !stateBuy;
  }

  // 2. Explicit country buy flag.
  const countryBuy = userRegion.country?.supported?.buy;
  if (typeof countryBuy === 'boolean') {
    return !countryBuy;
  }

  // 3. Fall back to membership in the countries list (only if we have a list).
  if (countries.length === 0) {
    return false; // indeterminate => fail-open
  }
  const isMember = countries.some(
    (c) => c.isoCode === userRegion.country?.isoCode,
  );
  return !isMember;
}
