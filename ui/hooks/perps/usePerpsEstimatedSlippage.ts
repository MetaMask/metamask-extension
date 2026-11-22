import { useEffect, useMemo, useRef, useState } from 'react';
import { PERFORMANCE_CONFIG } from '@metamask/perps-controller';
import { calculateEstimatedSlippageBps } from '../../components/app/perps/utils/slippageCalculation';
import { usePerpsLiveOrderBook } from './stream/usePerpsLiveOrderBook';

export type UsePerpsEstimatedSlippageOptions = {
  /** Asset symbol (e.g. 'BTC'). */
  symbol: string;
  /** USD notional to fill. Pass undefined / 0 to disable the calc. */
  sizeUsd: number | undefined;
  /** true = BUY (sweeps asks), false = SELL (sweeps bids). */
  isBuy: boolean;
  /** Disable the subscription entirely (e.g. for limit orders). */
  enabled?: boolean;
};

export type UsePerpsEstimatedSlippageReturn = {
  /** Estimated slippage in bps, or null when the book is loading or too shallow. */
  estimatedSlippageBps: number | null;
  /** True once the underlying order book subscription has produced data. */
  isReady: boolean;
};

function useThrottledValue<Value>(
  value: Value,
  throttleMs: number,
  resetKey?: string,
): Value {
  const [throttled, setThrottled] = useState(value);
  const lastUpdateRef = useRef(0);
  const timeoutRef = useRef<number>();
  const resetKeyRef = useRef(resetKey);

  useEffect(() => {
    const resetKeyChanged =
      resetKey !== undefined && resetKey !== resetKeyRef.current;

    if (resetKeyChanged) {
      resetKeyRef.current = resetKey;
      lastUpdateRef.current = Date.now();
      setThrottled(value);
      return () => {
        window.clearTimeout(timeoutRef.current);
      };
    }

    const now = Date.now();
    const elapsed = now - lastUpdateRef.current;

    const apply = () => {
      lastUpdateRef.current = Date.now();
      setThrottled(value);
    };

    if (elapsed >= throttleMs) {
      apply();
    } else {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(apply, throttleMs - elapsed);
    }

    return () => {
      window.clearTimeout(timeoutRef.current);
    };
  }, [value, throttleMs, resetKey]);

  return throttled;
}

/**
 * Estimates slippage in basis points for a market order from the live L2 book.
 * @param options0
 * @param options0.symbol
 * @param options0.sizeUsd
 * @param options0.isBuy
 * @param options0.enabled
 */
export function usePerpsEstimatedSlippage({
  symbol,
  sizeUsd,
  isBuy,
  enabled = true,
}: UsePerpsEstimatedSlippageOptions): UsePerpsEstimatedSlippageReturn {
  const { orderBook, isInitialLoading } = usePerpsLiveOrderBook({
    symbol,
    levels: PERFORMANCE_CONFIG.SlippageEstimateBookLevels,
    enabled,
    // Order entry page already activates the shared order-book stream for
    // top-of-book / limit mid-price; avoid deactivating it when slippage turns off.
    manageStream: false,
  });

  const throttledOrderBook = useThrottledValue(
    orderBook,
    PERFORMANCE_CONFIG.SlippageEstimateThrottleMs,
    symbol,
  );

  const estimatedSlippageBps = useMemo(() => {
    if (!enabled || !sizeUsd || sizeUsd <= 0) {
      return null;
    }
    return calculateEstimatedSlippageBps({
      orderBook: throttledOrderBook,
      sizeUsd,
      isBuy,
    });
  }, [throttledOrderBook, sizeUsd, isBuy, enabled]);

  return {
    estimatedSlippageBps,
    isReady: !isInitialLoading && throttledOrderBook !== null,
  };
}
