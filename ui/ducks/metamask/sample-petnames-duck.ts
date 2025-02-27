import type { Hex } from '@metamask/utils';
import { createSelector } from 'reselect';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentChainId } from '../../../shared/modules/selectors/networks';
import type {
  MetaMaskReduxDispatch,
  MetaMaskReduxState,
} from '../../store/store';
import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
// eslint-disable-next-line import/no-restricted-paths
import { type SamplePetnamesControllerState } from '../../../app/scripts/controllers/sample/sample-petnames-controller';

// Selectors
export const getSamplePetnamesByChainIdAndAddress = (
  state: MetaMaskReduxState,
) =>
  state.metamask.samplePetnamesByChainIdAndAddress as
    | SamplePetnamesControllerState['samplePetnamesByChainIdAndAddress']
    | undefined;

export const getPetNamesForCurrentChain = createSelector(
  [getSamplePetnamesByChainIdAndAddress, getCurrentChainId],
  (petnamesByChainIdAndAddress, chainId): Record<Hex, string> =>
    petnamesByChainIdAndAddress?.[chainId] ?? {},
);

// Actions
export const ASSIGN_PET_NAME_METHOD = 'assignPetname';

export const assignPetname = (chainId: Hex, address: Hex, name: string) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground(ASSIGN_PET_NAME_METHOD, [
      chainId,
      address,
      name,
    ]);
    await forceUpdateMetamaskState(dispatch);
  };
};

// Hook
export function usePetNames() {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const namesForCurrentChain = useSelector(getPetNamesForCurrentChain);
  const chainId = useSelector(getCurrentChainId);

  return {
    namesForCurrentChain,
    assignPetname: (address: Hex, name: string) =>
      dispatch(assignPetname(chainId, address, name)),
  };
}
