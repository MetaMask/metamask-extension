import { createSelector } from 'reselect';
import { MERKL_FEATURE_FLAG_KEY } from '../constants';
import { getRemoteFeatureFlags } from '../../../../selectors';
import {
  validatedVersionGatedFeatureFlag,
  VersionGatedFeatureFlag,
} from '../../../../../shared/lib/feature-flags/version-gating';

export const getMerklRewardsEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags): boolean => {
    const flag = remoteFeatureFlags?.[MERKL_FEATURE_FLAG_KEY] as
      | VersionGatedFeatureFlag
      | boolean
      | undefined;

    if (typeof flag === 'boolean') {
      return flag;
    }

    return Boolean(
      validatedVersionGatedFeatureFlag(flag as VersionGatedFeatureFlag),
    );
  },
);
