import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GeoRewardsMetadata, OnboardingStep } from './types';

export interface RewardsState {
  // Onboarding state
  onboardingModalOpen: boolean;
  onboardingActiveStep: OnboardingStep;

  // Geolocation state
  geoLocation: string | null;
  optinAllowedForGeo: boolean | null;
  optinAllowedForGeoLoading: boolean;
  optinAllowedForGeoError: boolean;
}

export const initialState: RewardsState = {
  onboardingModalOpen: true,
  onboardingActiveStep: OnboardingStep.INTRO,

  geoLocation: null,
  optinAllowedForGeo: null,
  optinAllowedForGeoLoading: false,
  optinAllowedForGeoError: false,
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

    setGeoRewardsMetadata: (
      state,
      action: PayloadAction<GeoRewardsMetadata | null>,
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

    setGeoRewardsMetadataLoading: (state, action: PayloadAction<boolean>) => {
      state.optinAllowedForGeoLoading = action.payload;
    },

    setGeoRewardsMetadataError: (state, action: PayloadAction<boolean>) => {
      state.optinAllowedForGeoError = action.payload;
    },
  },
});

export const {
  resetRewardsState,
  setOnboardingModalOpen,
  setOnboardingActiveStep,
} = rewardsSlice.actions;

export default rewardsSlice.reducer;
