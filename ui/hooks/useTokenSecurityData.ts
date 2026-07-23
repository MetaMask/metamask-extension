import { useCallback, useEffect, useRef, useState } from 'react';
import type { TokenSecurityData } from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import { fetchCachedTokenAssets } from '../pages/bridge/utils/token-security';

type UseTokenSecurityDataOpts = {
  /** CAIP-19 asset ID. When null, no fetch is attempted. */
  assetId: CaipAssetType | null;
  /** Pre-fetched security data — returned immediately if provided. */
  prefetchedData?: TokenSecurityData;
};

type UseTokenSecurityDataResult = {
  securityData: TokenSecurityData | null;
  isLoading: boolean;
  error: Error | null;
};

const isValidTokenSecurityData = (data: unknown): data is TokenSecurityData =>
  data !== null &&
  data !== undefined &&
  typeof data === 'object' &&
  typeof (data as TokenSecurityData).resultType === 'string' &&
  Array.isArray((data as TokenSecurityData).features);

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
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!assetId) {
      return;
    }
    try {
      const assets = await fetchCachedTokenAssets([assetId]);
      if (!isMountedRef.current) {
        return;
      }
      const asset = assets?.[0];
      setSecurityData(asset?.securityData ?? null);
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }
      setError(err as Error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [assetId]);

  useEffect(() => {
    isMountedRef.current = true;

    if (prefetchedData) {
      setSecurityData(prefetchedData);
      setIsLoading(false);
      return undefined;
    }

    if (!assetId) {
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [assetId, prefetchedData, fetchData]);

  return { securityData, isLoading, error };
};
