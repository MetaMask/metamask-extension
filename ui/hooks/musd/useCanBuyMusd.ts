/**
 * useCanBuyMusd Hook
 *
 * Single source of truth for whether the user can buy mUSD in their region.
 */

import { useMusdGeoBlocking } from './useMusdGeoBlocking';

export type UseCanBuyMusdResult = {
  /** Whether the user can buy mUSD given geo-blocking */
  canBuyMusdInRegion: boolean;
  /** Whether the geo-blocking check is still in progress */
  isLoading: boolean;
};

/**
 * Determines whether the current user can buy mUSD based on geo-blocking only.
 */
export function useCanBuyMusd(): UseCanBuyMusdResult {
  const { isBlocked, isLoading } = useMusdGeoBlocking();

  return {
    canBuyMusdInRegion: !isBlocked,
    isLoading,
  };
}

export default useCanBuyMusd;
