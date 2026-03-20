import { useQuery } from '@tanstack/react-query';
import type { CurrencyRateState } from '@metamask/assets-controllers';

/**
 * QueryKey must match the key used by CurrencyRateDataService.fetchQuery().
 *
 * BaseDataService queryKeys follow the format: ['ServiceName:actionName', ...params].
 * Production: import from shared/constants/tanstack-query-keys.ts.
 */
const CURRENCY_RATES_QUERY_KEY = [
  'CurrencyRateDataService:getCurrencyRates',
] as const;

/**
 * Currency rates query hook — reads from the UI QueryClient cache (background-pushed).
 *
 * Cache is populated by `useBackgroundQuerySync` receiving `cacheUpdate` events
 * from `CurrencyRateDataService` (extends `BaseDataService`). The data service
 * subscribes to `CurrencyRateController:stateChange` and stores the state via
 * `fetchQuery`. `BaseDataService` auto-publishes `cacheUpdate` events, which
 * `useBackgroundQuerySync` hydrates into the UI QueryClient.
 *
 * No UI network request is made — background is the authoritative source.
 *
 * Graceful degradation: queryFn returns undefined — if no background sync has
 * run yet, status is 'success' with data: undefined. Components should handle
 * the undefined case.
 */
export function useCurrencyRatesQuery() {
  return useQuery<CurrencyRateState['currencyRates'] | undefined>({
    queryKey: CURRENCY_RATES_QUERY_KEY,
    queryFn: () => Promise.resolve(undefined),
    staleTime: 30_000,
    enabled: true,
  });
}
