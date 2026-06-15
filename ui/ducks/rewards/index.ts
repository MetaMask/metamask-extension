import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  RewardsGeoMetadata,
  SeasonStatusState,
  RewardsErrorToastState,
} from '../../../shared/types/rewards';
import { CandidateSubscriptionId } from './types';

export type RewardsState = {
  // Modal + onboarding state
  rewardsModalOpen: boolean;
  onboardingReferralCode: string | null;

  // Geolocation state
  geoLocation: string | null;
  optinAllowedForGeo: boolean | null;
  optinAllowedForGeoLoading: boolean;
  optinAllowedForGeoError: boolean;

  // Rewards subscription / season status state
  candidateSubscriptionId: CandidateSubscriptionId;
  seasonStatus: SeasonStatusState | null;
  seasonStatusError: string | null;
  seasonStatusLoading: boolean;

  // Feature flag
  rewardsEnabled: boolean;
  // Error
  errorToast: RewardsErrorToastState;
  // Show/hide rewards badge
  rewardsBadgeHidden: boolean;
  // Account linked timestamp (when an account is linked to a subscription)
  accountLinkedTimestamp: number | null;
  // Full deeplink URL stored when user arrives via a rewards deeplink, used as QR code value
  rewardsDeeplinkUrl: string | null;
};

export const initialState: RewardsState = {
  rewardsModalOpen: false,
  onboardingReferralCode: '',

  geoLocation: null,
  optinAllowedForGeo: null,
  optinAllowedForGeoLoading: false,
  optinAllowedForGeoError: false,

  candidateSubscriptionId: 'pending',

  seasonStatus: null,
  seasonStatusError: null,
  seasonStatusLoading: false,

  // Feature flag
  rewardsEnabled: false,
  // Error
  errorToast: {
    isOpen: false,
    title: '',
    description: '',
    actionText: '',
    onActionClick: undefined,
  },
  // Show/hide rewards badge
  rewardsBadgeHidden: true,
  // Account linked timestamp
  accountLinkedTimestamp: null,
  rewardsDeeplinkUrl: null,
};

const rewardsSlice = createSlice({
  name: 'rewards',
  initialState,
  reducers: {
    resetRewardsState: () => {
      return {
        ...initialState,
        errorToast: { ...initialState.errorToast },
      };
    },

    setRewardsModalOpen: (state, action: PayloadAction<boolean>) => {
      state.rewardsModalOpen = action.payload;
    },

    setOnboardingReferralCode: (
      state,
      action: PayloadAction<string | null>,
    ) => {
      state.onboardingReferralCode = action.payload;
    },

    setRewardsGeoMetadata: (
      state,
      action: PayloadAction<RewardsGeoMetadata | null>,
    ) => {
      if (action.payload) {
        state.geoLocation = action.payload.geoLocation;
        state.optinAllowedForGeo = action.payload.optinAllowedForGeo;
        state.optinAllowedForGeoLoading = false;
      } else {
        state.geoLocation = null;
        state.optinAllowedForGeo = null;
        state.optinAllowedForGeoLoading = false;
      }
    },

    setRewardsGeoMetadataLoading: (state, action: PayloadAction<boolean>) => {
      state.optinAllowedForGeoLoading = action.payload;
    },

    setRewardsGeoMetadataError: (state, action: PayloadAction<boolean>) => {
      state.optinAllowedForGeoError = action.payload;
    },

    // Rewards subscription / season status reducers
    setCandidateSubscriptionId: (
      state,
      action: PayloadAction<string | 'pending' | 'error' | 'retry' | null>,
    ) => {
      const previousCandidateId = state.candidateSubscriptionId;
      const newCandidateId = action.payload;

      // Check if candidate ID changed and old value had a value (not null, 'pending', 'error', or 'retry')
      const hasValidPreviousId =
        previousCandidateId &&
        previousCandidateId !== 'pending' &&
        previousCandidateId !== 'error' &&
        previousCandidateId !==
          'error-existing-subscription-hardware-wallet-explicit-sign' &&
        previousCandidateId !== 'retry';

      const candidateIdChanged =
        hasValidPreviousId && previousCandidateId !== newCandidateId;

      if (candidateIdChanged) {
        // Reset UI state to initial values
        state.seasonStatus = initialState.seasonStatus;
        state.seasonStatusError = initialState.seasonStatusError;
        state.seasonStatusLoading = initialState.seasonStatusLoading;
      }

      state.candidateSubscriptionId = action.payload;
    },

    setSeasonStatusLoading: (state, action: PayloadAction<boolean>) => {
      state.seasonStatusLoading = action.payload;
    },

    setSeasonStatus: (
      state,
      action: PayloadAction<SeasonStatusState | null>,
    ) => {
      state.seasonStatus = action.payload;
    },

    setSeasonStatusError: (state, action: PayloadAction<string | null>) => {
      state.seasonStatusError = action.payload;
    },

    setErrorToast: (state, action: PayloadAction<RewardsErrorToastState>) => {
      state.errorToast = action.payload;
    },

    setRewardsBadgeHidden: (state, action: PayloadAction<boolean>) => {
      state.rewardsBadgeHidden = action.payload;
    },
    setRewardsAccountLinkedTimestamp: (
      state,
      action: PayloadAction<number | null>,
    ) => {
      state.accountLinkedTimestamp = action.payload;
    },

    setRewardsDeeplinkUrl: (state, action: PayloadAction<string | null>) => {
      state.rewardsDeeplinkUrl = action.payload;
    },
  },
});

export const {
  resetRewardsState,
  setRewardsModalOpen,
  setOnboardingReferralCode,
  setCandidateSubscriptionId,
  setSeasonStatusLoading,
  setSeasonStatus,
  setSeasonStatusError,
  setRewardsGeoMetadata,
  setRewardsGeoMetadataLoading,
  setRewardsGeoMetadataError,
  setErrorToast,
  setRewardsBadgeHidden,
  setRewardsAccountLinkedTimestamp,
  setRewardsDeeplinkUrl,
} = rewardsSlice.actions;

export default rewardsSlice.reducer;
