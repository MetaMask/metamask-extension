import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { getShowFiatInTestnets, getCurrentChainId } from '../selectors';
import { TEST_NETWORK_IDS } from '../../shared/constants/network';

/**
 * Returns true if the fiat value should be hidden for testnet networks.
 *
 * @param providedChainId
 * @returns boolean
 */
export const useHideFiatForTestnet = (providedChainId?: Hex): boolean => {
  const showFiatInTestnets = useSelector(getShowFiatInTestnets);
  const currentChainId = useSelector(getCurrentChainId);
  const chainId = providedChainId ?? currentChainId;
  return TEST_NETWORK_IDS.includes(chainId) && !showFiatInTestnets;
};
