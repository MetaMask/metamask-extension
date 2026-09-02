import { useQuery } from '@tanstack/react-query';
import type { TokenAsset } from '@metamask/assets-controllers';
import { isCaipAssetType, type CaipAssetType } from '@metamask/utils';
import { normalizeTokenAssetId } from '#shared/lib/asset-utils';
import { fetchTokenAsset } from './fetchTokenAsset';
import {
  getDisabledTokenAssetQueryKey,
  getTokenAssetQueryKey,
  tokenAssetGcTimeMs,
  tokenAssetStaleTimeMs,
} from './tokenAssetQuery';

type Props = {
  assetId?: CaipAssetType | string | null;
  fetchOnMiss?: boolean;
  enabled?: boolean;
};

/**
 * Reads a single TokenAsset from the shared per-asset cache.
 *
 * @param props.assetId - CAIP-19 asset identifier. Invalid values disable the query.
 * @param props.fetchOnMiss - When true, fetches from the Token API if the asset is not cached. Defaults to false.
 * @param props.enabled - When false, the query is disabled. Defaults to true.
 * @returns TanStack Query result for the TokenAsset, or null when missing.
 */
export const useTokenAssetQuery = ({
  assetId,
  fetchOnMiss = false,
  enabled = true,
}: Props) => {
  const normalizedAssetId =
    assetId && isCaipAssetType(assetId) ? normalizeTokenAssetId(assetId) : null;

  return useQuery<TokenAsset | null>({
    queryKey: normalizedAssetId
      ? getTokenAssetQueryKey(normalizedAssetId)
      : getDisabledTokenAssetQueryKey(),
    queryFn: () => fetchTokenAsset(normalizedAssetId as CaipAssetType),
    enabled: enabled && Boolean(normalizedAssetId) && fetchOnMiss,
    staleTime: tokenAssetStaleTimeMs,
    gcTime: tokenAssetGcTimeMs,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
