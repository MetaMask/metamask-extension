import { useQuery } from '@tanstack/react-query';
import type { V3SpotPricesResponse } from '@metamask/core-backend';
import { apiClient } from '../helpers/api-client';

/**
 * Spot prices query hook — UI-direct fetch with full call-site cache policy control.
 *
 * `staleTime` is owned at the call site — swap screens can override for fresher
 * data, portfolio screens accept the default 30s staleTime.
 *
 * @param assetIds - Asset IDs to fetch prices for
 * @param currency - Target currency (default: 'usd')
 * @param staleTimeOverride - Per-call staleTime override in ms (e.g. 10_000 for swap screen)
 */
export function useSpotPricesQuery(
  assetIds: string[],
  currency = 'usd',
  staleTimeOverride?: number,
) {
  // getV3SpotPricesQueryOptions returns { queryKey, queryFn, staleTime, gcTime }
  // queryKey sorts assetIds deterministically — matches background-side queryKey
  const queryOptions = apiClient.prices.getV3SpotPricesQueryOptions(assetIds, {
    currency,
  });

  // @ts-expect-error apiClient uses @tanstack/query-core v5 types; repo is on @tanstack/react-query v4
  return useQuery<V3SpotPricesResponse>({
    ...queryOptions,
    enabled: assetIds.length > 0,
    // Call-site staleTime override — decouples fetch ownership from cache policy.
    ...(staleTimeOverride !== undefined && { staleTime: staleTimeOverride }),
  });
}
