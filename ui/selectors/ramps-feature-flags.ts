import { createSelector } from 'reselect';
import { isObject } from '@metamask/utils';
import { getRemoteFeatureFlags } from '../../shared/lib/selectors/remote-feature-flags';
import {
  isProgressiveRolloutWrapper,
  validatedVersionGatedFeatureFlag,
} from '../../shared/lib/remote-feature-flag-utils';

const EMPTY_PROVIDER_IDS: string[] = [];

/**
 * Selector to determine if the ramps service disruption is active.
 *
 * @param state - The root Redux state object.
 * @returns Boolean indicating whether ramps service disruption is active.
 */
export const getIsRampsServiceDisruptionActive = createSelector(
  getRemoteFeatureFlags,
  (flags) => Boolean(flags?.rampsServiceDisruption),
);

/**
 * Provider ids that the Buy pre-selection puts ahead of the user's order
 * history when they offer the token (the user's own pick still wins).
 *
 * Flag shape: `{ enabled, minimumVersion, providerIds: string[] }`.
 * Returns an empty list (history first) when the flag is missing, invalid,
 * disabled or below the minimum version.
 */
export const getRampsProvidersAheadOfHistory = createSelector(
  getRemoteFeatureFlags,
  (flags): string[] => {
    const rawFlag = flags?.rampsProvidersAheadOfHistory;
    if (!validatedVersionGatedFeatureFlag(rawFlag)) {
      return EMPTY_PROVIDER_IDS;
    }
    const flag = isProgressiveRolloutWrapper(rawFlag) ? rawFlag.value : rawFlag;
    const providerIds = isObject(flag) ? flag.providerIds : undefined;
    if (
      !Array.isArray(providerIds) ||
      providerIds.length === 0 ||
      !providerIds.every((id) => typeof id === 'string' && id.length > 0)
    ) {
      return EMPTY_PROVIDER_IDS;
    }
    return providerIds as string[];
  },
);
