import { createSelector } from 'reselect';
import type { MetaMaskReduxState } from '../../store/store';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import { getUseExternalServices } from '../../selectors/selectors';
import {
  validatedVersionGatedFeatureFlag,
  type VersionGatedFeatureFlag,
} from '../../../shared/lib/feature-flags/version-gating';

export const selectRewardsModalOpen = (state: MetaMaskReduxState) =>
  state.rewards.rewardsModalOpen;

export const selectOnboardingReferralCode = (state: MetaMaskReduxState) =>
  state.rewards.onboardingReferralCode;

export const selectOptinAllowedForGeo = (state: MetaMaskReduxState) =>
  state.rewards.optinAllowedForGeo;

export const selectOptinAllowedForGeoLoading = (state: MetaMaskReduxState) =>
  state.rewards.optinAllowedForGeoLoading;

export const selectOptinAllowedForGeoError = (state: MetaMaskReduxState) =>
  state.rewards.optinAllowedForGeoError;

// Rewards subscription / season status selectors
export const selectCandidateSubscriptionId = (state: MetaMaskReduxState) =>
  state.rewards.candidateSubscriptionId;

export const selectSeasonStatusLoading = (state: MetaMaskReduxState) =>
  state.rewards.seasonStatusLoading;

export const selectSeasonStatus = (state: MetaMaskReduxState) =>
  state.rewards.seasonStatus;

export const selectSeasonStatusError = (state: MetaMaskReduxState) =>
  state.rewards.seasonStatusError;

export const selectRewardsEnabled = createSelector(
  getRemoteFeatureFlags,
  getUseExternalServices,
  (remoteFeatureFlags, useExternalServices): boolean => {
    const rewardsFeatureFlag = remoteFeatureFlags?.rewardsEnabled as
      | VersionGatedFeatureFlag
      | boolean
      | undefined;

    const resolveFlag = (flag: unknown): boolean => {
      if (typeof flag === 'boolean') {
        return flag;
      }
      return Boolean(
        validatedVersionGatedFeatureFlag(flag as VersionGatedFeatureFlag),
      );
    };

    const featureFlagEnabled = resolveFlag(rewardsFeatureFlag);
    return featureFlagEnabled && Boolean(useExternalServices);
  },
);

export const selectErrorToast = (state: MetaMaskReduxState) =>
  state.rewards.errorToast;

export const selectRewardsBadgeHidden = (state: MetaMaskReduxState) =>
  state.rewards.rewardsBadgeHidden;

export const selectRewardsAccountLinkedTimestamp = (
  state: MetaMaskReduxState,
) => state.rewards?.accountLinkedTimestamp ?? null;

export const selectRewardsDeeplinkUrl = (state: MetaMaskReduxState) =>
  state.rewards.rewardsDeeplinkUrl ?? null;

/**
 * Whether the VIP program (fee discounts + VIP badge) is enabled.
 *
 * Reads the `vipProgramEnabled` remote feature flag. Supports both a plain
 * boolean and a version-gated object (`{ enabled, minimumVersion }`). When
 * `false`, absent, or the current version doesn't meet the minimum, VIP tier
 * lookups and discount calculations are suppressed across the app (perps,
 * bridge, etc.).
 */
export const selectVipProgramEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags): boolean => {
    const flag = remoteFeatureFlags?.vipProgramEnabled as
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
