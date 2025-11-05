import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getUseExternalServices } from '../../selectors';
import { getRemoteFeatureFlags } from '../../selectors/remote-feature-flags';
import {
  validatedVersionGatedFeatureFlag,
  VersionGatedFeatureFlag,
} from '../../../shared/lib/feature-flags/version-gating';

/**
 * Custom hook to check if rewards feature is enabled.
 * Follows the same logic as the RewardsController's isDisabled function.
 *
 * @returns boolean - True if rewards feature is enabled, false otherwise
 */
export const useRewardsEnabled = (): boolean => {
  const remoteFeatureFlags = useSelector(getRemoteFeatureFlags);
  const useExternalServices = useSelector(getUseExternalServices);

  const isRewardsEnabled = useMemo(() => {
    const rewardsFeatureFlag = remoteFeatureFlags?.rewardsEnabled as
      | VersionGatedFeatureFlag
      | boolean
      | undefined;

    // Resolve the feature flag (can be boolean or VersionGatedFeatureFlag)
    const resolveFlag = (flag: unknown): boolean => {
      if (typeof flag === 'boolean') {
        return flag;
      }
      return Boolean(
        validatedVersionGatedFeatureFlag(flag as VersionGatedFeatureFlag),
      );
    };

    const featureFlagEnabled = resolveFlag(rewardsFeatureFlag);

    // Rewards are enabled when BOTH feature flag is enabled AND useExternalServices is true
    return featureFlagEnabled && Boolean(useExternalServices);
  }, [remoteFeatureFlags, useExternalServices]);

  return isRewardsEnabled;
};
