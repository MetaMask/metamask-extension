import type { Hex } from '@metamask/utils';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import type { MetaMaskReduxDispatch } from '../../../store/store';
import { getPetNamesForCurrentChain } from './sample-petnames-controller-selectors';
import { assignPetname } from './sample-petnames-controller-thunks';

// Hook
export function usePetnames() {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const namesForCurrentChain = useSelector(getPetNamesForCurrentChain);
  const chainId = useSelector(getCurrentChainId);

  return {
    namesForCurrentChain,
    assignPetname: (address: Hex, name: string) =>
      dispatch(assignPetname(chainId, address, name)),
  };
}
