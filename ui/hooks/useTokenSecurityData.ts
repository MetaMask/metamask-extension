import { useCallback, useEffect, useRef, useState } from 'react';
import type { TokenSecurityData } from '@metamask/assets-controllers';
import { parseCaipAssetType, type CaipAssetType } from '@metamask/utils';
import { fetchCachedTokenAssets } from '../pages/bridge/utils/token-security';

type UseTokenSecurityDataOpts = {
  /** CAIP-19 asset ID. When null, no fetch is attempted. */
  assetId: CaipAssetType | null;
  /** Pre-fetched security data — returned immediately if provided. */
  prefetchedData?: TokenSecurityData;
};

export type TokenSecurityAssetMetadata = {
  symbol?: string;
  name?: string;
  decimals?: number;
  address?: string;
  isNative?: boolean;
};

type UseTokenSecurityDataResult = {
  securityData: TokenSecurityData | null;
  isLoading: boolean;
  error: Error | null;
} & TokenSecurityAssetMetadata;

const getAssetMetadataFromAssetId = (
  assetId: CaipAssetType,
): TokenSecurityAssetMetadata => {
  try {
    const { assetReference, assetNamespace } = parseCaipAssetType(assetId);
    return {
      address: assetReference,
      isNative: assetNamespace === 'slip44',
    };
  } catch {
    return {};
  }
};

const isValidTokenSecurityData = (data: unknown): data is TokenSecurityData =>
  data !== null &&
  data !== undefined &&
  typeof data === 'object' &&
  typeof (data as TokenSecurityData).resultType === 'string' &&
  Array.isArray((data as TokenSecurityData).features);

// TODO(security-trust): Once home page Security & Trust signals land (separate PR)
// via TanStack Query, read from the shared query cache first and fall back to REST
// (`fetchCachedTokenAssets`) when cached data is unavailable.
export const useTokenSecurityData = ({
  assetId,
  prefetchedData: rawPrefetchedData,
}: UseTokenSecurityDataOpts): UseTokenSecurityDataResult => {
  const prefetchedData = isValidTokenSecurityData(rawPrefetchedData)
    ? rawPrefetchedData
    : undefined;

  const [securityData, setSecurityData] = useState<TokenSecurityData | null>(
    prefetchedData ?? null,
  );
  const [isLoading, setIsLoading] = useState(
    !prefetchedData && Boolean(assetId),
  );
  const [error, setError] = useState<Error | null>(null);
  const [assetMetadata, setAssetMetadata] =
    useState<TokenSecurityAssetMetadata>({});
  const activeAssetIdRef = useRef<CaipAssetType | null>(null);

  const fetchData = useCallback(async (requestAssetId: CaipAssetType) => {
    try {
      const assets = await fetchCachedTokenAssets([requestAssetId]);
      if (requestAssetId !== activeAssetIdRef.current) {
        return;
      }
      const asset = assets?.[0];
      setSecurityData(asset?.securityData ?? null);
      setAssetMetadata(
        asset
          ? {
              symbol: asset.symbol,
              name: asset.name,
              decimals: asset.decimals,
              ...getAssetMetadataFromAssetId(requestAssetId),
            }
          : getAssetMetadataFromAssetId(requestAssetId),
      );
      setError(null);
    } catch (err) {
      if (requestAssetId !== activeAssetIdRef.current) {
        return;
      }
      setError(err as Error);
    } finally {
      if (requestAssetId === activeAssetIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (prefetchedData) {
      activeAssetIdRef.current = assetId;
      setSecurityData(prefetchedData);
      setError(null);
      setIsLoading(false);
      return undefined;
    }

    if (!assetId) {
      activeAssetIdRef.current = null;
      setSecurityData(null);
      setError(null);
      setAssetMetadata({});
      setIsLoading(false);
      return undefined;
    }

    activeAssetIdRef.current = assetId;
    setSecurityData(null);
    setError(null);
    setAssetMetadata(getAssetMetadataFromAssetId(assetId));
    setIsLoading(true);
    fetchData(assetId);

    return () => {
      activeAssetIdRef.current = null;
    };
  }, [assetId, prefetchedData, fetchData]);

  return { securityData, isLoading, error, ...assetMetadata };
};
