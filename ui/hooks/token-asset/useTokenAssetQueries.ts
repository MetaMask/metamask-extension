import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import type { TokenAsset } from '@metamask/assets-controllers';
import { type CaipAssetType } from '@metamask/utils';
import { fetchTokenAsset } from './token-asset-batcher';
import {
  getTokenAssetQueryKey,
  getUniqueTokenAssetIds,
  queryGcTimeMs,
  queryStaleTimeMs,
} from './token-asset-query';

type Props<TSelected> = {
  assetIds: CaipAssetType[];
  enabled?: boolean;
  select?: (data: TokenAsset | null | undefined) => TSelected;
};

function selectTokenAsset(data: TokenAsset | null | undefined) {
  return data;
}

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
        staleTime: queryStaleTimeMs,
        gcTime: queryGcTimeMs,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      })),
    [enabled, select, uniqueAssetIds],
  );

  return useQueries({ queries });
}
