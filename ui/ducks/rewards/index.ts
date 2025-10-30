import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type {
  RewardsGeoMetadata,
  SeasonStatusState,
} from '../../../shared/types/rewards';
import { RewardsErrorToastProps } from '../../components/app/rewards/RewardsErrorToast';
import { OnboardingStep } from './types';

export type RewardsState = {
  // Onboarding state
  onboardingModalOpen: boolean;
  onboardingActiveStep: OnboardingStep;

  // Geolocation state
  geoLocation: string | null;
  optinAllowedForGeo: boolean | null;
  optinAllowedForGeoLoading: boolean;
  optinAllowedForGeoError: boolean;

  // Rewards subscription / season status state
  candidateSubscriptionId: string | null;
  candidateSubscriptionIdLoading: boolean;
  candidateSubscriptionIdError: boolean;
  seasonStatus: SeasonStatusState | null;
  seasonStatusError: string | null;
  seasonStatusLoading: boolean;

  // Feature flag
  rewardsEnabled: boolean;
  // Error
  errorToast: RewardsErrorToastProps;
};

export const initialState: RewardsState = {
  onboardingModalOpen: false,
  onboardingActiveStep: OnboardingStep.INTRO,

  geoLocation: null,
  optinAllowedForGeo: null,
  optinAllowedForGeoLoading: false,
  optinAllowedForGeoError: false,

  candidateSubscriptionId: null,
  candidateSubscriptionIdLoading: false,
  candidateSubscriptionIdError: false,
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
    resetRewardsState: (state) => {
      Object.assign(state, initialState);
    },

    setOnboardingModalOpen: (state, action: PayloadAction<boolean>) => {
      state.onboardingModalOpen = action.payload;
    },

    setOnboardingActiveStep: (state, action: PayloadAction<OnboardingStep>) => {
      state.onboardingActiveStep = action.payload;
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
      action: PayloadAction<string | null>,
    ) => {
      state.candidateSubscriptionId = action.payload;
    },

    setCandidateSubscriptionIdLoading: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.candidateSubscriptionIdLoading = action.payload;
    },

    setCandidateSubscriptionIdError: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.candidateSubscriptionIdError = action.payload;
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

    setErrorToast: (state, action: PayloadAction<RewardsErrorToastProps>) => {
      state.errorToast = action.payload;
    },
  },
});

export const {
  resetRewardsState,
  setOnboardingModalOpen,
  setOnboardingActiveStep,
  setCandidateSubscriptionId,
  setCandidateSubscriptionIdLoading,
  setCandidateSubscriptionIdError,
  setSeasonStatusLoading,
  setSeasonStatus,
  setSeasonStatusError,
  setRewardsGeoMetadata,
  setRewardsGeoMetadataLoading,
  setRewardsGeoMetadataError,
  setErrorToast,
} = rewardsSlice.actions;

export default rewardsSlice.reducer;
