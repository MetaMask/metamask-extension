import { useMemo } from 'react';
import type { Position } from '@metamask/perps-controller';
import { getDisplaySymbol } from '../../components/app/perps/utils';
import { usePerpsLivePositions } from './stream';

export type UsePerpsPositionForAssetReturn = {
  /** The account's open position on this market, when one exists */
  position: Position | undefined;
  /** True until the positions stream has delivered its first payload */
  isLoading: boolean;
};

/**
 * Finds the account's open Perps position for a market, mirroring mobile's
 * `usePerpsPositionForAsset`, so asset surfaces can show and act on the
 * position the user already holds instead of only offering Long / Short.
 *
 * This subscribes to the live positions stream. Pass an empty string when no
 * market has been matched yet: the hook then returns no position and
 * `isLoading: false` so callers can wait on market loading independently.
 *
 * @param marketSymbol - Perps market name for the asset (e.g. 'ETH')
 * @returns The matching position and the stream's loading state
 */
export function usePerpsPositionForAsset(
  marketSymbol: string,
): UsePerpsPositionForAssetReturn {
  const { positions, isInitialLoading } = usePerpsLivePositions();

  const position = useMemo(() => {
    if (!marketSymbol) {
      return undefined;
    }
    const needle = marketSymbol.toLowerCase();
    // An exact provider-symbol match wins; the display-symbol comparison is a
    // fallback so a HIP-3 position ('xyz:TSLA') still matches when the caller
    // only has the wallet ticker ('TSLA'), and vice versa.
    return (
      positions.find(
        (candidate) => candidate.symbol.toLowerCase() === needle,
      ) ??
      positions.find(
        (candidate) =>
          getDisplaySymbol(candidate.symbol).toLowerCase() ===
          getDisplaySymbol(marketSymbol).toLowerCase(),
      )
    );
  }, [positions, marketSymbol]);

  return {
    position,
    isLoading: Boolean(marketSymbol) && isInitialLoading,
  };
}
