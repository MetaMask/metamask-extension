import { createSelector } from 'reselect';
import type {
  Country,
  Provider,
  RampsToken,
  ResourceState,
  TokensResponse,
  UserRegion,
} from '@metamask/ramps-controller';
import { isRampRegionDefinitivelyUnsupported } from '../pages/ramps/utils/rampRegionEligibility';

// Controller state is flattened onto `state.metamask`.
type RampsRootState = {
  metamask: {
    userRegion: UserRegion | null;
    countries: ResourceState<Country[]>;
    providers: ResourceState<Provider[], Provider | null>;
    tokens: ResourceState<TokensResponse | null, RampsToken | null>;
  };
};

/**
 * Selects the user's region from Ramps controller state.
 *
 * @param state - The Redux state.
 * @returns The user's region or null if not set.
 */
export const getRampsUserRegion = (state: RampsRootState) =>
  state.metamask.userRegion;

/**
 * Selects the countries resource state from Ramps controller.
 *
 * @param state - The Redux state.
 * @returns The countries resource state.
 */
export const getRampsCountries = (state: RampsRootState) =>
  state.metamask.countries;

/**
 * Selects the providers resource state from Ramps controller.
 *
 * @param state - The Redux state.
 * @returns The providers resource state.
 */
export const getRampsProviders = (state: RampsRootState) =>
  state.metamask.providers;

/**
 * Selects the tokens resource state from Ramps controller.
 *
 * @param state - The Redux state.
 * @returns The tokens resource state.
 */
export const getRampsTokens = (state: RampsRootState) => state.metamask.tokens;

/**
 * Determines if the user's region is unsupported for ramps.
 *
 * @param state - The Redux state.
 * @returns True if the region is unsupported, false otherwise.
 */
export const getIsRampRegionUnsupported = createSelector(
  getRampsUserRegion,
  getRampsCountries,
  (userRegion, countries) =>
    isRampRegionDefinitivelyUnsupported(userRegion, countries?.data ?? []),
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
  getRampsUserRegion,
  getRampsCountries,
  (userRegion, countries) =>
    userRegion === null &&
    !countries?.isLoading &&
    (countries?.data?.length ?? 0) > 0,
);
