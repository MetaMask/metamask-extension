import { useSelector } from 'react-redux';
import { useEffect, useMemo, useState } from 'react';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import {
  isCaipAssetType,
  parseCaipAssetType,
  type CaipAssetType,
  type Hex,
} from '@metamask/utils';

import {
  CHAIN_ID_TOKEN_IMAGE_MAP,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
} from '../../../../../shared/constants/network';
import {
  fetchAssetMetadataForAssetIds,
  getAssetImageUrl,
  toAssetId,
  type AssetMetadata,
} from '../../../../../shared/lib/asset-utils';
import {
  getAssetsBySelectedAccountGroup,
  getAssetsBySelectedAccountGroupIncludingHidden,
} from '../../../../selectors/assets';
import { getIsTokenManagementFilterEnabled } from '../../../../selectors/multichain/feature-flags';
import { AssetStandard, type Asset } from '../../types/send';
import { useChainNetworkNameAndImageMap } from '../useChainNetworkNameAndImage';

export type EnrichTokenRequest = {
  chainId: Hex;
  address: string;
};

type UseSendTokensOptions = {
  includeNoBalance?: boolean;
  tokenFilter?: (chainId: string, address: string) => boolean;
  enrichTokenRequests?: EnrichTokenRequest[];
};

const EMPTY_ENRICH_TOKEN_REQUESTS: EnrichTokenRequest[] = [];

export const useSendTokens = (options: UseSendTokensOptions = {}): Asset[] => {
  const {
    includeNoBalance = false,
    tokenFilter,
    enrichTokenRequests = EMPTY_ENRICH_TOKEN_REQUESTS,
  } = options;
  const chainNetworkNAmeAndImageMap = useChainNetworkNameAndImageMap();
  const includeHiddenTokens = useSelector(getIsTokenManagementFilterEnabled);
  const assets = useSelector(
    includeHiddenTokens
      ? getAssetsBySelectedAccountGroupIncludingHidden
      : getAssetsBySelectedAccountGroup,
  );
  const [enrichedTokensMetadata, setEnrichedTokensMetadata] = useState<
    Record<CaipAssetType, AssetMetadata>
  >({});

  const flatAssets = useMemo(() => Object.values(assets).flat(), [assets]);

  const enrichAssetIds = useMemo(() => {
    return enrichTokenRequests
      .map(({ address, chainId }) => toAssetId(address, chainId))
      .filter((assetId): assetId is CaipAssetType => Boolean(assetId));
  }, [enrichTokenRequests]);

  useEffect(() => {
    let cancelled = false;

    if (enrichAssetIds.length === 0) {
      setEnrichedTokensMetadata((current) =>
        Object.keys(current).length === 0 ? current : {},
      );
      return undefined;
    }

    const abortController = new AbortController();

    fetchAssetMetadataForAssetIds(enrichAssetIds, abortController.signal)
      .then((metadata) => {
        if (!cancelled) {
          setEnrichedTokensMetadata(metadata ?? {});
        }
      })
      .catch((error) => {
        if (!cancelled && !isAbortError(error)) {
          setEnrichedTokensMetadata({});
        }
      });

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [enrichAssetIds]);

  const assetsWithBalance = useMemo(() => {
    return flatAssets.filter((asset) => {
      if (tokenFilter) {
        const chainId = String(asset.chainId ?? '');
        const address = getTokenFilterAddress(asset);

        if (!chainId || !address || !tokenFilter(chainId, address)) {
          return false;
        }
      }

      if (includeNoBalance) {
        return true;
      }

      const haveBalance = asset.rawBalance !== '0x0';
      return asset.isNative || haveBalance;
    });
  }, [flatAssets, includeNoBalance, tokenFilter]);

  const processedAssets = useMemo<Asset[]>(() => {
    const processedWalletAssets: Asset[] = assetsWithBalance.map((asset) => {
      const chainNetworkNameAndImage = chainNetworkNAmeAndImageMap.get(
        asset.chainId as Hex,
      );

      let imageSource: string | undefined;
      if (asset.isNative) {
        // Try chain-specific token image first, then fall back to network image
        imageSource =
          CHAIN_ID_TOKEN_IMAGE_MAP[
            asset.chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
          ] ?? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[asset.chainId as Hex];
      } else {
        imageSource = asset.image;
      }

      return {
        ...asset,
        image: imageSource,
        networkImage: chainNetworkNameAndImage?.networkImage,
        networkName: chainNetworkNameAndImage?.networkName,
        shortenedBalance:
          asset.balance === undefined ? undefined : String(asset.balance),
        standard: asset.isNative ? AssetStandard.Native : AssetStandard.ERC20,
      };
    });

    if (enrichAssetIds.length === 0) {
      return processedWalletAssets;
    }

    const existingTokenKeys = new Set(
      processedWalletAssets.map(
        (token) =>
          `${String(token.chainId ?? '').toLowerCase()}:${String(
            token.address ?? '',
          ).toLowerCase()}`,
      ),
    );

    const enrichedAssets = enrichTokenRequests.reduce<Asset[]>(
      (result, { address, chainId }) => {
        const assetId = toAssetId(address, chainId);
        if (!assetId) {
          return result;
        }

        const tokenKey = `${chainId.toLowerCase()}:${address.toLowerCase()}`;
        if (existingTokenKeys.has(tokenKey)) {
          return result;
        }

        const metadata =
          enrichedTokensMetadata[assetId] ??
          enrichedTokensMetadata[assetId.toLowerCase() as CaipAssetType];

        if (!metadata?.symbol && !metadata?.name) {
          return result;
        }

        const chainNetworkNameAndImage =
          chainNetworkNAmeAndImageMap.get(chainId);

        result.push({
          address: address.toLowerCase(),
          assetId,
          balance: '0',
          chainId,
          decimals: metadata.decimals,
          fiat: {
            balance: 0,
            currency: 'USD',
          },
          image: getAssetImageUrl(assetId, chainId) ?? '',
          isNative: false,
          name: metadata.name,
          networkImage: chainNetworkNameAndImage?.networkImage,
          networkName: chainNetworkNameAndImage?.networkName,
          rawBalance: '0x0' as Hex,
          shortenedBalance: '0',
          standard: AssetStandard.ERC20,
          symbol: metadata.symbol,
        });

        return result;
      },
      [],
    );

    return [...processedWalletAssets, ...enrichedAssets];
  }, [
    assetsWithBalance,
    chainNetworkNAmeAndImageMap,
    enrichAssetIds.length,
    enrichTokenRequests,
    enrichedTokensMetadata,
  ]);

  return useMemo(() => {
    return [...processedAssets].sort(
      (a, b) => (b.fiat?.balance ?? 0) - (a.fiat?.balance ?? 0),
    );
  }, [processedAssets]);
};

function getTokenFilterAddress(asset: Asset): string | undefined {
  const chainId = String(asset.chainId ?? '');

  if (asset.isNative && chainId) {
    try {
      return getNativeTokenAddress(chainId as Hex);
    } catch {
      return asset.address;
    }
  }

  if (asset.address) {
    return String(asset.address);
  }

  if (asset.assetId && isCaipAssetType(asset.assetId)) {
    return parseCaipAssetType(asset.assetId).assetReference;
  }

  return asset.assetId;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
