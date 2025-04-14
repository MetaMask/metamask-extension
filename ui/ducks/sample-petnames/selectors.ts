import type { Hex } from '@metamask/utils';
import { createSelector } from 'reselect';
import { type SamplePetnamesControllerState } from '@metamask/sample-controllers';
import { getCurrentChainId } from '../../../shared/modules/selectors/networks';
import type { MetaMaskReduxState } from '../../store/store';
// eslint-disable-next-line import/no-restricted-paths

// Selectors
export const getSamplePetnamesByChainIdAndAddress = (
  state: Pick<MetaMaskReduxState, 'metamask'>,
) =>
  state.metamask.namesByChainIdAndAddress as
    | SamplePetnamesControllerState['namesByChainIdAndAddress']
    | undefined;

export const getPetnamesForCurrentChain = createSelector(
  [getSamplePetnamesByChainIdAndAddress, getCurrentChainId],
  (namesByChainIdAndAddress, chainId): Record<Hex, string> =>
    namesByChainIdAndAddress?.[chainId] ?? {},
);
