import { useCallback, useEffect, useMemo, useState } from 'react';
import type { OrderFill } from '@metamask/perps-controller';
import { useSelector } from 'react-redux';
import { PERPS_CONSTANTS } from '../../components/app/perps/constants';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import { submitRequestToBackground } from '../../store/background-connection';
import { usePerpsLiveFills } from './stream';

type UsePerpsMarketFillsParams = {
  symbol: string;
  throttleMs?: number;
};

type UsePerpsMarketFillsReturn = {
  fills: OrderFill[];
  isInitialLoading: boolean;
};

/**
 * Hook for fetching market-specific fills with combined WebSocket + REST data.
 *
 * Combines two data sources:
 * 1. WebSocket (via usePerpsLiveFills) - Real-time updates, limited to recent fills
 * 2. REST API (via perpsGetOrderFills) - Historical fills from last 3 months
 *
 * WebSocket data displays immediately for instant feedback.
 * REST data loads in background and merges silently for complete history.
 * Live fills take precedence over REST fills (fresher data).
 *
 * @param params - Configuration options including symbol filter
 * @param params.symbol - Market symbol to filter fills for (e.g., "BTC", "ETH")
 * @param params.throttleMs - Throttle interval for WebSocket updates in ms (default: 0)
 * @returns Object containing fills array and loading state
 */
export function usePerpsMarketFills({
  symbol,
  throttleMs = 0,
}: UsePerpsMarketFillsParams): UsePerpsMarketFillsReturn {
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;

  const { fills: liveFills, isInitialLoading: wsLoading } = usePerpsLiveFills({
    throttleMs,
  });

  const [restFills, setRestFills] = useState<OrderFill[]>([]);
  const [isRestLoading, setIsRestLoading] = useState(true);

  const fetchRestFills = useCallback(async () => {
    const startTime = Date.now() - PERPS_CONSTANTS.FILLS_LOOKBACK_MS;
    const result = await submitRequestToBackground<OrderFill[]>(
      'perpsGetOrderFills',
      [{ aggregateByTime: false, startTime }],
    );
    return Array.isArray(result) ? result : [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRestFills([]);
    setIsRestLoading(true);

    fetchRestFills()
      .then((result) => {
        if (!cancelled) {
          setRestFills(result);
        }
      })
      .catch(() => {
        // REST fetch failed silently — WebSocket fills still work
      })
      .finally(() => {
        if (!cancelled) {
          setIsRestLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchRestFills, selectedAddress]);

  const fills = useMemo(() => {
    const fillsMap = new Map<string, OrderFill>();

    for (const fill of restFills) {
      if (fill.symbol === symbol) {
        const key = `${fill.orderId}-${fill.timestamp}-${fill.size}-${fill.price}`;
        fillsMap.set(key, fill);
      }
    }

    for (const fill of liveFills) {
      if (fill.symbol === symbol) {
        const key = `${fill.orderId}-${fill.timestamp}-${fill.size}-${fill.price}`;
        fillsMap.set(key, fill);
      }
    }

    return Array.from(fillsMap.values()).sort(
      (a, b) => b.timestamp - a.timestamp,
    );
  }, [restFills, liveFills, symbol]);

  const isInitialLoading = wsLoading || isRestLoading;

  return {
    fills,
    isInitialLoading,
  };
}
