import {
  selectOnboardingModalOpen,
  selectOnboardingActiveStep,
  selectOptinAllowedForGeo,
  selectOptinAllowedForGeoLoading,
  selectOptinAllowedForGeoError,
  selectCandidateSubscriptionId,
  selectSeasonStatusLoading,
  selectSeasonStatus,
  selectSeasonStatusError,
  selectErrorToast,
  selectRewardsEnabled,
} from './selectors';
import { OnboardingStep } from './types';
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
    it('selectOnboardingModalOpen returns modal open state', () => {
      const state = buildState({
        rewards: { onboardingModalOpen: true },
      });
      expect(selectOnboardingModalOpen(state)).toBe(true);
    });

    it('selectOnboardingActiveStep returns active step', () => {
      const state = buildState({
        rewards: { onboardingActiveStep: OnboardingStep.STEP1 },
      });
      expect(selectOnboardingActiveStep(state)).toBe(OnboardingStep.STEP1);
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
  });

  describe('selectRewardsEnabled', () => {
    it('returns false when external services disabled regardless of flag', () => {
      const state = buildState({
        metamask: {
          useExternalServices: false,
          remoteFeatureFlags: { rewardsEnabled: true },
        },
      });
      expect(selectRewardsEnabled(state)).toBe(false);
    });

    it('returns true when flag true and external services enabled', () => {
      const state = buildState({
        metamask: {
          useExternalServices: true,
          remoteFeatureFlags: { rewardsEnabled: true },
        },
      });
      expect(selectRewardsEnabled(state)).toBe(true);
    });

    it('returns false when flag false and external services enabled', () => {
      const state = buildState({
        metamask: {
          useExternalServices: true,
          remoteFeatureFlags: { rewardsEnabled: false },
        },
      });
      expect(selectRewardsEnabled(state)).toBe(false);
    });

    it('supports version-gated flag when minimum version satisfied', () => {
      const state = buildState({
        metamask: {
          useExternalServices: true,
          remoteFeatureFlags: {
            rewardsEnabled: { enabled: true, minimumVersion: '0.0.0' },
          },
        },
      });
      expect(selectRewardsEnabled(state)).toBe(true);
    });

    it('returns false for invalid version-gated flag shape', () => {
      const state = buildState({
        metamask: {
          useExternalServices: true,
          remoteFeatureFlags: {
            // minimumVersion null yields hasMinimumRequiredVersion=false
            rewardsEnabled: { enabled: true, minimumVersion: null },
          },
        },
      });
      expect(selectRewardsEnabled(state)).toBe(false);
    });
  });
});
