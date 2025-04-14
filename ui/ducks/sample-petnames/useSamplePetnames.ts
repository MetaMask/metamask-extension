import type { Hex } from '@metamask/utils';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentChainId } from '../../../shared/modules/selectors/networks';
import type { MetaMaskReduxDispatch } from '../../store/store';
import { getPetnamesForCurrentChain } from './selectors';
import { assignPetname } from './actions';

// Hook
export default function useSamplePetnames() {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const namesForCurrentChain = useSelector(getPetnamesForCurrentChain);
  const chainId = useSelector(getCurrentChainId);

  return {
    namesForCurrentChain,
    assignPetname: (address: Hex, name: string) =>
      dispatch(assignPetname(chainId, address, name)),
  };
}
