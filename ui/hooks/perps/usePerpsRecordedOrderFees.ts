import { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import { usePerpsMarketFills } from './usePerpsMarketFills';

type UsePerpsRecordedOrderFeesReturn = {
  /** Sum of fees recorded in fills matched to this order. `undefined` when orderId is absent. */
  totalFee: number | undefined;
  /** True while the fill data is being fetched for the first time. */
  isLoading: boolean;
};

/**
 * Returns the cumulative fee actually paid for a historical order by summing
 * the `fee` field across all fills whose `orderId` matches the given order.
 *
 * This is the source-of-truth fee for the details screen — it reflects what
 * Hyperliquid recorded at execution time rather than recalculating from the
 * current fee schedule.  Partially filled or canceled orders are handled
 * correctly because only fills that executed contribute to the sum.
 *
 * @param orderId - Hyperliquid order ID to look up.
 * @param symbol - Asset symbol used to scope the fills fetch (e.g. 'BTC').
 * @returns Recorded total fee in USD and loading state.
 */
export function usePerpsRecordedOrderFees(
  orderId: string | undefined,
  symbol: string,
): UsePerpsRecordedOrderFeesReturn {
  const { fills, isInitialLoading } = usePerpsMarketFills({ symbol });

  const totalFee = useMemo(() => {
    if (!orderId) {
      return undefined;
    }
    return fills
      .filter((f) => f.orderId === orderId)
      .reduce(
        (sum, f) => sum.plus(new BigNumber(f.fee || '0')),
        new BigNumber(0),
      )
      .toNumber();
  }, [fills, orderId]);

  return { totalFee, isLoading: isInitialLoading };
}
