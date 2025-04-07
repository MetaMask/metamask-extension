import type { Hex } from '@metamask/utils';
import type { MetaMaskReduxDispatch } from '../../store/store';
import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';

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
