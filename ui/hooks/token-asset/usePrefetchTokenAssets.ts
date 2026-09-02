import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { type CaipAssetType } from '@metamask/utils';
import { getUseExternalServices } from '../../selectors';
import { normalizeTokenAssetId } from '#shared/lib/asset-utils';
import {
  getTokenAssetQueryKey,
  getTokenAssetStaleTime,
  tokenAssetGcTimeMs,
} from './tokenAssetQuery';
import { fetchTokenAsset } from './fetchTokenAsset';

type Props = {
  assetIds: CaipAssetType[];
};

export const usePrefetchTokenAssets = ({ assetIds }: Props) => {
  const queryClient = useQueryClient();
  const allowExternalServices = useSelector(getUseExternalServices);
  const uniqueAssetIds = useMemo(
    () => [
      ...new Set(assetIds.map((assetId) => normalizeTokenAssetId(assetId))),
    ],
    [assetIds],
  );
  const assetIdsKey = uniqueAssetIds.join(',');

  useEffect(() => {
    if (!allowExternalServices) {
      return;
    }

    uniqueAssetIds.forEach((assetId) => {
      queryClient.prefetchQuery({
        queryKey: getTokenAssetQueryKey(assetId),
        queryFn: () => fetchTokenAsset(assetId),
        staleTime: getTokenAssetStaleTime,
        gcTime: tokenAssetGcTimeMs,
      });
    });
  }, [allowExternalServices, assetIdsKey, queryClient, uniqueAssetIds]);
};
