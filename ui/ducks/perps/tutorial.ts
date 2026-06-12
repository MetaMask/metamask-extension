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
};

export const initialState: PerpsTutorialState = {
  tutorialModalOpen: false,
  activeStep: PerpsTutorialStep.WhatArePerps,
  tutorialCompleted: false,
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

    resetTutorialState: () => {
      return { ...initialState };
    },
  },
});

export const {
  setTutorialModalOpen,
  setTutorialActiveStep,
  markTutorialCompleted,
  resetTutorialState,
} = perpsTutorialSlice.actions;

export default perpsTutorialSlice.reducer;
