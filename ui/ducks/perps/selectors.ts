import type { MetaMaskReduxState } from '../../store/store';

export const selectTutorialModalOpen = (state: MetaMaskReduxState) =>
  state.perpsTutorial.tutorialModalOpen;

export const selectTutorialActiveStep = (state: MetaMaskReduxState) =>
  state.perpsTutorial.activeStep;

export const selectTutorialCompleted = (state: MetaMaskReduxState) =>
  state.perpsTutorial.tutorialCompleted;
