import type { Hex } from '@metamask/utils';
import { createSelector } from 'reselect';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentChainId } from '../../../shared/modules/selectors/networks';
import type { MetaMaskReduxDispatch } from '../../store/store';
import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';

// Types
export type PetNamesState = {
  namesByChainIdAndAddress: Record<Hex, Record<Hex, string>>;
};

// Actions
export const ASSIGN_PET_NAME = 'PetNamesController:assignPetName';

export const assignPetName = (
  chainId: string,
  address: string,
  name: string,
) => {
  return async (dispatch: MetaMaskReduxDispatch) => {
    await submitRequestToBackground(ASSIGN_PET_NAME, [chainId, address, name]);
    await forceUpdateMetamaskState(dispatch);
  };
};

// Selectors
export const getPetNamesByChainId = createSelector(
  [
    (state: { PetNamesController?: PetNamesState }) =>
      state.PetNamesController?.namesByChainIdAndAddress,
  ],
  (namesByChainIdAndAddress) => namesByChainIdAndAddress ?? {},
);

export const getPetNamesForCurrentChain = createSelector(
  [getPetNamesByChainId, getCurrentChainId],
  (namesByChainIdAndAddress, chainId): Record<Hex, string> =>
    namesByChainIdAndAddress[chainId] ?? {},
);

// Hook
export function usePetNames() {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const namesForCurrentChain = useSelector(getPetNamesForCurrentChain);
  const chainId = useSelector(getCurrentChainId);

  return {
    namesForCurrentChain,
    assignPetName: (address: string, name: string) =>
      dispatch(assignPetName(chainId, address, name)),
  };
}
