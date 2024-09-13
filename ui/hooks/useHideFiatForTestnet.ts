import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { getShowFiatInTestnets, getCurrentChainId } from '../selectors';
import { TEST_NETWORK_IDS } from '../../shared/constants/network';

type TestNetworkIds = (typeof TEST_NETWORK_IDS)[number];

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
  return (
    !showFiatInTestnets && TEST_NETWORK_IDS.includes(chainId as TestNetworkIds)
  );
};
