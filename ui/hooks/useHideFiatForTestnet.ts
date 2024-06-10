import { useSelector } from 'react-redux';
import { getShowFiatInTestnets, getCurrentChainId } from '../selectors';
import { TEST_NETWORK_IDS } from '../../shared/constants/network';

/**
 * Returns true if the fiat value should be hidden for testnet networks.
 *
 * @returns boolean
 */
export const useHideFiatForTestnet = (): boolean => {
  const showFiatInTestnets = useSelector(getShowFiatInTestnets);
  const chainId = useSelector(getCurrentChainId);
  return TEST_NETWORK_IDS.includes(chainId) && !showFiatInTestnets;
};
