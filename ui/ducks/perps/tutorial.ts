import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const PerpsTutorialStep = {
  WhatArePerps: 'WhatArePerps',
  GoLongOrShort: 'GoLongOrShort',
  ChooseLeverage: 'ChooseLeverage',
  WatchLiquidation: 'WatchLiquidation',
  CloseAnytime: 'CloseAnytime',
  ReadyToTrade: 'ReadyToTrade',
} as const;

/**
 * Union type derived from PerpsTutorialStep values
 */
export type PerpsTutorialStep =
  (typeof PerpsTutorialStep)[keyof typeof PerpsTutorialStep];

/**
 * Ordered array of tutorial steps for navigation
 */
export const TUTORIAL_STEPS_ORDER: PerpsTutorialStep[] = [
  PerpsTutorialStep.WhatArePerps,
  PerpsTutorialStep.GoLongOrShort,
  PerpsTutorialStep.ChooseLeverage,
  PerpsTutorialStep.WatchLiquidation,
  PerpsTutorialStep.CloseAnytime,
  PerpsTutorialStep.ReadyToTrade,
];

export type PerpsTutorialState = {
  tutorialModalOpen: boolean;
  activeStep: PerpsTutorialStep;
  tutorialCompleted: boolean;
  autoOpenAttempted: boolean;
};

export const initialState: PerpsTutorialState = {
  tutorialModalOpen: false,
  activeStep: PerpsTutorialStep.WhatArePerps,
  tutorialCompleted: false,
  autoOpenAttempted: false,
};

const perpsTutorialSlice = createSlice({
  name: 'perpsTutorial',
  initialState,
  reducers: {
    setTutorialModalOpen: (state, action: PayloadAction<boolean>) => {
      state.tutorialModalOpen = action.payload;
      // Reset to first step when opening
      if (action.payload) {
        state.activeStep = PerpsTutorialStep.WhatArePerps;
      }
    },

    setTutorialActiveStep: (
      state,
      action: PayloadAction<PerpsTutorialStep>,
    ) => {
      state.activeStep = action.payload;
    },

    markTutorialCompleted: (state) => {
      state.tutorialCompleted = true;
      state.tutorialModalOpen = false;
    },

    // Marks that the Perps home tab has already made its one-time attempt to
    // auto-open the tutorial for a first-time user. This is claimed
    // immediately on mount (before isFirstTimeUser/isLoading resolve) so that
    // remounting the Perps tab — e.g. after navigating back from Market
    // Details — never gets a second chance to auto-open the modal. See
    // PerpsView's auto-open effect.
    markTutorialAutoOpenAttempted: (state) => {
      state.autoOpenAttempted = true;
    },

    resetTutorialState: () => {
      return { ...initialState };
    },
  },
});

export const {
  setTutorialModalOpen,
  setTutorialActiveStep,
  markTutorialCompleted,
  markTutorialAutoOpenAttempted,
  resetTutorialState,
} = perpsTutorialSlice.actions;

export default perpsTutorialSlice.reducer;
