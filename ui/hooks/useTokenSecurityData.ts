import type { TokenSecurityData } from '@metamask/assets-controllers';
import { parseCaipAssetType, type CaipAssetType } from '@metamask/utils';
import { isNativeCaipAssetId } from '#shared/lib/asset-utils';
import { useTokenAssetQuery } from '#ui/hooks/token-asset/useTokenAssetQuery';

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
    const { assetReference } = parseCaipAssetType(assetId);
    return {
      address: assetReference,
      isNative: isNativeCaipAssetId(assetId),
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

export const useTokenSecurityData = ({
  assetId,
  prefetchedData: rawPrefetchedData,
}: UseTokenSecurityDataOpts): UseTokenSecurityDataResult => {
  const prefetchedData = isValidTokenSecurityData(rawPrefetchedData)
    ? rawPrefetchedData
    : undefined;

  const { data, isLoading, error } = useTokenAssetQuery({
    assetId,
    fetchOnMiss: !prefetchedData,
    enabled: Boolean(assetId) && !prefetchedData,
  });

  const parsedAssetMetadata = assetId
    ? getAssetMetadataFromAssetId(assetId)
    : {};

  if (prefetchedData) {
    return {
      securityData: prefetchedData,
      isLoading: false,
      error: null,
      ...parsedAssetMetadata,
    };
  }

  if (!assetId) {
    return {
      securityData: null,
      isLoading: false,
      error: null,
    };
  }

  return {
    securityData: data?.securityData ?? null,
    isLoading,
    error: error ?? null,
    symbol: data?.symbol,
    name: data?.name,
    decimals: data?.decimals,
    ...parsedAssetMetadata,
  };
};
