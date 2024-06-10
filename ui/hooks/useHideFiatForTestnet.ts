import { useSelector } from 'react-redux';
import { getShowFiatInTestnets, getCurrentChainId } from '../selectors';
import { TEST_NETWORK_IDS } from '../../shared/constants/network';

export const useHideFiatForTestnet = (): boolean => {
  const showFiatInTestnets = useSelector(getShowFiatInTestnets);
  const chainId = useSelector(getCurrentChainId);
  return TEST_NETWORK_IDS.includes(chainId) && !showFiatInTestnets;
};
