import type { CurrencyRateState } from '@metamask/assets-controllers';
import type { Json } from '@metamask/utils';
import { createControllerStore, useControllerState } from './useControllerState';

/**
 * Extract currency rates data from a BaseDataService cacheUpdate payload.
 *
 * The background's `CurrencyRateDataService` uses `@tanstack/query-core`
 * internally, so the cacheUpdate event carries a `DehydratedState` payload.
 * This extractor isolates the actual data from TQ's serialization format —
 * the UI doesn't need to know TQ is involved on the background side.
 */
function extractCurrencyRates(
  payload: Json,
): CurrencyRateState['currencyRates'] | undefined {
  // payload shape: [{ state: { queries: [{ state: { data } }] } }]
  const tuple = payload as unknown as [{ state?: { queries?: { state?: { data?: unknown } }[] } }];
  return tuple?.[0]?.state?.queries?.[0]?.state?.data as
    | CurrencyRateState['currencyRates']
    | undefined;
}

const currencyRatesStore = createControllerStore<
  CurrencyRateState['currencyRates']
>('CurrencyRateDataService:cacheUpdate', extractCurrencyRates);

/**
 * Currency rates — controller state pushed from background.
 *
 * Uses `useSyncExternalStore` over messenger events, not TanStack Query.
 * The background owns fetch cadence via `CurrencyRateDataService`;
 * the UI subscribes and renders the latest value.
 *
 * Returns `undefined` before the first background push.
 */
export function useCurrencyRatesQuery() {
  return useControllerState(
    currencyRatesStore,
    'CurrencyRateDataService:cacheUpdate',
  );
}
