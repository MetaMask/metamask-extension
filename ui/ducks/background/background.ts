/* eslint-disable jsdoc/require-param */
import type { AnyAction } from 'redux';
import * as actionConstants from '../../store/actionConstants';
import { BackgroundStateProxy } from '../../../shared/types/background';
import { initialBackgroundState } from './constants';

export type BackgroundSliceState = {
  background: BackgroundStateProxy;
};

/**
 * The `background` slice is keyed by controller name, while the `metamask` slice is flattened,
 * meaning all controller state properties are nested at the same level without any indication as to which controller owns which property.
 *
 * The `background` slice is intended to eventually replace the `metamask` slice.
 * As the state properties of each background controller are migrated from the `metamask` slice to `background` slices,
 * any related patches, selectors, actions, types etc. that are currently defined in the `metamask` slice will also need to be migrated.
 *
 * ! Do not modify. See https://github.com/MetaMask/metamask-extension/issues/29600.
 *
 * @param state - State
 * @param action
 * @returns Composed state object consisting of background controller state objects keyed by controller name.
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
