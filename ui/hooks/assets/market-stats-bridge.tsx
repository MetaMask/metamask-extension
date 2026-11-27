import { useMarketStatsListener } from './market-stats';

/**
 * Keeps the live quote map in the query cache current for the whole app.
 * Mount once inside `QueryClientProvider`. It renders nothing.
 */
export function MarketStatsBridge(): null {
  useMarketStatsListener();
  return null;
}
