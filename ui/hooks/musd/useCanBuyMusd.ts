/**
 * useCanBuyMusd Hook
 *
 * Single source of truth for whether the user can buy mUSD in their region.
 * Composes geo-blocking and hardcoded buyable-chain gating so callers
 * don't need to assemble these conditions themselves.
 */

import { useMemo } from 'react';
import {
  MUSD_BUYABLE_CHAIN_IDS,
  isMusdBuyableOnChain,
} from '../../components/app/musd/constants';
import { useMusdGeoBlocking } from './useMusdGeoBlocking';
import { useMusdNetworkFilter } from './useMusdNetworkFilter';

export type UseCanBuyMusdResult = {
  /** Whether the user can buy mUSD given geo-blocking and current network selection */
  canBuyMusdInRegion: boolean;
  /** Whether the geo-blocking check is still in progress */
  isLoading: boolean;
};

/**
 * Determines whether the current user can buy mUSD.
 *
 * The user can buy when both conditions are met:
 * 1. They are not in a geo-blocked region.
 * 2. mUSD is buyable on the selected chain (or any buyable chain when viewing popular networks).
 */
export function useCanBuyMusd(): UseCanBuyMusdResult {
  const { isBlocked, isLoading: geoIsLoading } = useMusdGeoBlocking();
  const { selectedChainId, isPopularNetworksFilterActive } =
    useMusdNetworkFilter();

  const isMusdBuyable = useMemo(() => {
    if (isPopularNetworksFilterActive) {
      return MUSD_BUYABLE_CHAIN_IDS.length > 0;
    }
    if (selectedChainId) {
      return isMusdBuyableOnChain(selectedChainId);
    }
    return false;
  }, [isPopularNetworksFilterActive, selectedChainId]);

  return {
    canBuyMusdInRegion: !geoIsLoading && !isBlocked && isMusdBuyable,
    isLoading: geoIsLoading,
  };
}

export default useCanBuyMusd;
