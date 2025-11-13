import { createSelector } from 'reselect';
import type { MetaMaskReduxState } from '../../store/store';
import { getRemoteFeatureFlags } from '../../selectors/remote-feature-flags';
import { getUseExternalServices } from '../../selectors/selectors';
import {
  validatedVersionGatedFeatureFlag,
  type VersionGatedFeatureFlag,
} from '../../../shared/lib/feature-flags/version-gating';

export const selectOnboardingModalOpen = (state: MetaMaskReduxState) =>
  state.rewards.onboardingModalOpen;

export const selectOnboardingActiveStep = (state: MetaMaskReduxState) =>
  state.rewards.onboardingActiveStep;

export const selectOnboardingModalRendered = (state: MetaMaskReduxState) =>
  state.rewards.onboardingModalRendered;

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
