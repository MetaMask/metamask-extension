import {
  selectRewardsModalOpen,
  selectOnboardingReferralCode,
  selectOptinAllowedForGeo,
  selectOptinAllowedForGeoLoading,
  selectOptinAllowedForGeoError,
  selectCandidateSubscriptionId,
  selectSeasonStatusLoading,
  selectSeasonStatus,
  selectSeasonStatusError,
  selectErrorToast,
  selectRewardsEnabled,
  selectRewardsBadgeHidden,
} from './selectors';
import { initialState as rewardsInitialState } from '.';

describe('rewards selectors', () => {
  const buildState = (opts?: {
    rewards?: Partial<typeof rewardsInitialState>;
    metamask?: {
      remoteFeatureFlags?: Record<string, unknown>;
      useExternalServices?: boolean;
    };
  }) => {
    const rewards = {
      ...rewardsInitialState,
      ...(opts?.rewards || {}),
    };

    const metamask = {
      remoteFeatureFlags: {},
      useExternalServices: false,
      ...(opts?.metamask || {}),
    };

    return {
      rewards,
      metamask,
    } as unknown as import('../../store/store').MetaMaskReduxState;
  };

  describe('simple state selectors', () => {
    it('selectRewardsModalOpen returns modal open state', () => {
      const state = buildState({
        rewards: { rewardsModalOpen: true },
      });
      expect(selectRewardsModalOpen(state)).toBe(true);
    });

    it('selectOnboardingReferralCode returns referral code', () => {
      const state = buildState({
        rewards: { onboardingReferralCode: ' ABC123 ' },
      });
      expect(selectOnboardingReferralCode(state)).toBe(' ABC123 ');
    });

    it('selectOptinAllowedForGeo returns geo eligibility', () => {
      const state = buildState({
        rewards: { optinAllowedForGeo: true },
      });
      expect(selectOptinAllowedForGeo(state)).toBe(true);
    });

    it('selectOptinAllowedForGeoLoading returns geo loading state', () => {
      const state = buildState({
        rewards: { optinAllowedForGeoLoading: true },
      });
      expect(selectOptinAllowedForGeoLoading(state)).toBe(true);
    });

    it('selectOptinAllowedForGeoError returns geo error', () => {
      const state = buildState({
        rewards: { optinAllowedForGeoError: true },
      });
      expect(selectOptinAllowedForGeoError(state)).toBe(true);
    });

    it('selectCandidateSubscriptionId returns candidate subscription id', () => {
      const state = buildState({
        rewards: { candidateSubscriptionId: 'sub-123' },
      });
      expect(selectCandidateSubscriptionId(state)).toBe('sub-123');
    });

    it('selectSeasonStatusLoading returns status loading', () => {
      const state = buildState({
        rewards: { seasonStatusLoading: true },
      });
      expect(selectSeasonStatusLoading(state)).toBe(true);
    });

    it('selectSeasonStatus returns season status', () => {
      const seasonStatus = { currentTier: 1 } as unknown as ReturnType<
        typeof selectSeasonStatus
      >;
      const state = buildState({
        rewards: { seasonStatus },
      });
      expect(selectSeasonStatus(state)).toBe(seasonStatus);
    });

    it('selectSeasonStatusError returns status error', () => {
      const state = buildState({
        rewards: { seasonStatusError: 'error' },
      });
      expect(selectSeasonStatusError(state)).toBe('error');
    });

    it('selectErrorToast returns error toast info', () => {
      const errorToast = { title: 'Uh oh' } as unknown as ReturnType<
        typeof selectErrorToast
      >;
      const state = buildState({
        rewards: { errorToast },
      });
      expect(selectErrorToast(state)).toBe(errorToast);
    });

    it('selectRewardsBadgeHidden returns hidden state', () => {
      const state = buildState({
        rewards: { rewardsBadgeHidden: true },
      });
      expect(selectRewardsBadgeHidden(state)).toBe(true);
    });
  });

  describe('selectRewardsEnabled', () => {
    it('returns false when basic functionality is disabled', () => {
      const state = buildState({
        metamask: {
          useExternalServices: false,
        },
      });
      expect(selectRewardsEnabled(state)).toBe(false);
    });

    it('returns true when basic functionality is enabled', () => {
      const state = buildState({
        metamask: {
          useExternalServices: true,
        },
      });
      expect(selectRewardsEnabled(state)).toBe(true);
    });
  });
});
