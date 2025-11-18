import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  RewardsGeoMetadata,
  SeasonStatusState,
  RewardsErrorToastState,
} from '../../../shared/types/rewards';
import { CandidateSubscriptionId, OnboardingStep } from './types';

export type RewardsState = {
  // Onboarding state
  onboardingModalOpen: boolean;
  onboardingActiveStep: OnboardingStep;
  onboardingModalRendered: boolean;

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
};

export const initialState: RewardsState = {
  onboardingModalOpen: false,
  onboardingActiveStep: OnboardingStep.INTRO,
  onboardingModalRendered: false,

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

    setOnboardingModalOpen: (state, action: PayloadAction<boolean>) => {
      state.onboardingModalOpen = action.payload;
    },

    setOnboardingActiveStep: (state, action: PayloadAction<OnboardingStep>) => {
      state.onboardingActiveStep = action.payload;
    },

    setOnboardingModalRendered: (state, action: PayloadAction<boolean>) => {
      state.onboardingModalRendered = action.payload;
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
  },
});

export const {
  resetRewardsState,
  setOnboardingModalOpen,
  setOnboardingActiveStep,
  setOnboardingModalRendered,
  setCandidateSubscriptionId,
  setSeasonStatusLoading,
  setSeasonStatus,
  setSeasonStatusError,
  setRewardsGeoMetadata,
  setRewardsGeoMetadataLoading,
  setRewardsGeoMetadataError,
  setErrorToast,
} = rewardsSlice.actions;

export default rewardsSlice.reducer;
