import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { TokenAsset } from '@metamask/assets-controllers';
import { type CaipAssetType } from '@metamask/utils';
import { fetchTokenAsset } from './fetchTokenAsset';
import {
  getTokenAssetQueryKey,
  getUniqueTokenAssetIds,
  tokenAssetGcTimeMs,
  tokenAssetStaleTimeMs,
} from './tokenAssetQuery';

type Props<TSelected> = {
  assetIds: CaipAssetType[];
  enabled?: boolean;
  select?: (data: TokenAsset | null | undefined) => TSelected;
};

function selectTokenAsset(data: TokenAsset | null | undefined) {
  return data;
}

/**
 * Fetches TokenAsset data for multiple CAIP-19 asset IDs via the shared per-asset cache.
 *
 * @param props.assetIds - CAIP-19 asset identifiers to load.
 * @param props.enabled - When false, no fetches are started. Defaults to true.
 * @param props.select - Optional selector applied to each cached TokenAsset.
 * @returns TanStack `useQueries` results in the same order as deduped, sorted asset IDs.
 */
export function useTokenAssetQueries<TSelected = TokenAsset | null>({
  assetIds,
  enabled = true,
  select = selectTokenAsset as (
    data: TokenAsset | null | undefined,
  ) => TSelected,
}: Props<TSelected>) {
  const uniqueAssetIds = useMemo(
    () => getUniqueTokenAssetIds(assetIds),
    [assetIds],
  );

  const queries = useMemo(
    () =>
      uniqueAssetIds.map((assetId) => ({
        queryKey: getTokenAssetQueryKey(assetId),
        queryFn: () => fetchTokenAsset(assetId),
        enabled,
        select,
        staleTime: tokenAssetStaleTimeMs,
        gcTime: tokenAssetGcTimeMs,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      })),
    [enabled, select, uniqueAssetIds],
  );

  return useQueries({ queries });
}
