import { CaipAssetType, CaipChainId, Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { getUseExternalServices } from '../../../../../selectors';
import {
  fetchAssetMetadata,
  getAssetImageUrl,
} from '../../../../../../shared/lib/asset-utils';
import { AssetType } from '../../../../../../shared/constants/transaction';
import { useAsyncResult } from '../../../../../hooks/useAsync';

/**
 * Fetches token metadata for a single token if searchQuery is defined but filteredTokenList is empty
 *
 * @param searchQuery - The search query to fetch metadata for
 * @param shouldFetchMetadata - Whether to fetch metadata
 * @param abortControllerRef - The abort controller ref to use for the fetch request
 * @param chainId - The chain id to fetch metadata for
 * @returns The asset metadata
 */
export const useAssetMetadata = (
  searchQuery: string,
  shouldFetchMetadata: boolean,
  abortControllerRef: React.MutableRefObject<AbortController | null>,
  chainId?: Hex | CaipChainId,
) => {
  const allowExternalServices = useSelector(getUseExternalServices);

  const { value: assetMetadata } = useAsyncResult<
    | {
        address: Hex | CaipAssetType | string;
        symbol: string;
        decimals: number;
        image: string;
        chainId: Hex | CaipChainId;
        isNative: boolean;
        type: AssetType.token;
        balance: string;
        string: string;
      }
    | undefined
  >(async () => {
    if (!chainId || !searchQuery) {
      return undefined;
    }

    const trimmedSearchQuery = searchQuery.trim();
    if (
      allowExternalServices &&
      shouldFetchMetadata &&
      trimmedSearchQuery.length > 30
    ) {
      abortControllerRef.current = new AbortController();
      const metadata = await fetchAssetMetadata(
        trimmedSearchQuery,
        chainId,
        abortControllerRef.current.signal,
      );

      if (metadata) {
        return {
          ...metadata,
          chainId,
          isNative: false,
          type: AssetType.token,
          image: getAssetImageUrl(metadata.assetId, chainId) ?? '',
          balance: '',
          string: '',
        } as const;
      }
      return undefined;
    }
    return undefined;
  }, [shouldFetchMetadata, searchQuery]);

  return assetMetadata;
};
