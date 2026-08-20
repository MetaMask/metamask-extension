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
