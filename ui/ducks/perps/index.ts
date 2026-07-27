/**
 * Perps Redux slice
 *
 * This directory contains Redux state management (actions, reducers, selectors)
 * for the Perps trading feature.
 *
 * @see {@link https://github.com/MetaMask/metamask-extension} for more info
 */

export {
  default as perpsTutorialReducer,
  setTutorialModalOpen,
  setTutorialActiveStep,
  markTutorialCompleted,
  markTutorialAutoOpenAttempted,
  resetTutorialState,
  PerpsTutorialStep,
  TUTORIAL_STEPS_ORDER,
} from './tutorial';
export type { PerpsTutorialState } from './tutorial';

export {
  selectTutorialModalOpen,
  selectTutorialActiveStep,
  selectTutorialCompleted,
  selectTutorialAutoOpenAttempted,
} from './selectors';
