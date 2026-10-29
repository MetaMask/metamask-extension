import { useQuery } from '@tanstack/react-query';
import type { TokenAsset } from '@metamask/assets-controllers';
import { isCaipAssetType, type CaipAssetType } from '@metamask/utils';
import { normalizeTokenAssetId } from '#shared/lib/asset-utils';
import { fetchTokenAsset } from './token-asset-batcher';
import {
  getDisabledTokenAssetQueryKey,
  getTokenAssetQueryKey,
  queryGcTimeMs,
  queryStaleTimeMs,
} from './token-asset-query';

type Props = {
  assetId?: CaipAssetType | string | null;
  fetchOnMiss?: boolean;
  enabled?: boolean;
};

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
    staleTime: queryStaleTimeMs,
    gcTime: queryGcTimeMs,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
