import type { MetaMaskReduxState } from '../../store/store';

export const selectOnboardingModalOpen = (state: MetaMaskReduxState) =>
  state.rewards.onboardingModalOpen;

export const selectOnboardingActiveStep = (state: MetaMaskReduxState) =>
  state.rewards.onboardingActiveStep;

export const selectOptinAllowedForGeo = (state: MetaMaskReduxState) =>
  state.rewards.optinAllowedForGeo;

export const selectOptinAllowedForGeoLoading = (state: MetaMaskReduxState) =>
  state.rewards.optinAllowedForGeoLoading;

export const selectOptinAllowedForGeoError = (state: MetaMaskReduxState) =>
  state.rewards.optinAllowedForGeoError;
