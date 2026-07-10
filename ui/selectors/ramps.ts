import { createSelector } from 'reselect';
import { isRampRegionDefinitivelyUnsupported } from '../pages/ramps/utils/rampRegionEligibility';
import { selectUserRegion, selectCountries } from './rampsController';

/**
 * Determines if the user's region is unsupported for ramps.
 *
 * @param state - The Redux state.
 * @returns True if the region is unsupported, false otherwise.
 */
export const getIsRampRegionUnsupported = createSelector(
  selectUserRegion,
  selectCountries,
  (userRegion, countries) =>
    isRampRegionDefinitivelyUnsupported(userRegion, countries.data),
);

/**
 * Determines if geolocation is unknown. This is only true once countries
 * have actually loaded (`countries.data` non-empty) and userRegion is still
 * null — i.e. region resolution demonstrably completed without a match.
 * Never-fetched, still-loading, or errored countries states fail open
 * (return false) rather than blocking the user.
 *
 * @param state - The Redux state.
 * @returns True if geolocation is unknown, false otherwise.
 */
export const getIsRampsGeolocationUnknown = createSelector(
  selectUserRegion,
  selectCountries,
  (userRegion, countries) =>
    userRegion === null && !countries.isLoading && countries.data.length > 0,
);
