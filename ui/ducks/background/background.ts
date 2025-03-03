/* eslint-disable jsdoc/require-param */
import type { AnyAction } from 'redux';
import * as actionConstants from '../../store/actionConstants';
import { BackgroundStateProxy } from '../../../shared/types/background';
import { initialBackgroundState } from './constants';

export type BackgroundSliceState = {
  background: BackgroundStateProxy;
};

/**
 * Temporary types for this slice so that inference of MetaMask state tree can
 * occur
 *
 * @param state - State
 * @param action
 * @returns
 */
export default function reduceBackground(
  state: BackgroundSliceState['background'],
  action: AnyAction,
): BackgroundStateProxy {
  const backgroundState = {
    ...initialBackgroundState,
    ...state,
  };
  switch (action.type) {
    case actionConstants.UPDATE_BACKGROUND_STATE:
      return { ...backgroundState, ...action.value };

    default:
      return backgroundState;
  }
}
