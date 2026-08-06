import type { TrendingAsset } from '@metamask/assets-controllers';
import {
  formatAddressToCaipReference,
  formatChainIdToHex,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import {
  type CaipAssetType,
  type Hex,
  isCaipAssetType,
  parseCaipAssetType,
} from '@metamask/utils';

import { buildAssetRoutePath } from '../../../shared/lib/asset-route';
import { getCaipAssetImageUrl } from '../../../shared/lib/asset-utils';

/**
 * Token metadata passed through router location state so the asset page can
 * render unowned Discover Search results without a wallet holding.
 * Shape matches the asset page's location-state token contract.
 */
export type DiscoverAssetLocationStateToken = {
  address: string;
  symbol: string;
  name: string;
  chainId: string;
  image?: string;
  isNative?: boolean;
  decimals: number;
  price?: number;
};

export type DiscoverAssetNavigation = {
  path: string;
  state: {
    token: DiscoverAssetLocationStateToken;
  };
};

type DiscoverAssetNavigationInput = Pick<
  TrendingAsset,
  'assetId' | 'symbol' | 'name' | 'decimals' | 'price'
> & {
  iconUrl?: string;
};

const getDiscoverAssetAddress = ({
  assetId,
  isNative,
  isNonEvm,
  assetReference,
}: {
  assetId: CaipAssetType;
  isNative: boolean;
  isNonEvm: boolean;
  assetReference: string;
}): string => {
  if (isNonEvm) {
    return assetId;
  }

  if (isNative) {
    return '';
  }

  return formatAddressToCaipReference(assetReference);
};

const getDiscoverAssetPrice = (
  price: string | undefined,
): number | undefined => {
  if (price === undefined || price === '') {
    return undefined;
  }

  const numericPrice = Number(price);
  return Number.isFinite(numericPrice) ? numericPrice : undefined;
};

/**
 * Builds Discover Search → Token Details navigation.
 * Uses the CAIP-19 asset route and passes token metadata in location state so
 * unowned search results still render without a wallet holding or metadata fetch.
 *
 * @param asset - Discover search result (or popular-asset stub).
 * @returns Navigation path + state, or null when assetId is not a CAIP asset type.
 */
export const buildDiscoverAssetNavigation = (
  asset: DiscoverAssetNavigationInput,
): DiscoverAssetNavigation | null => {
  if (!isCaipAssetType(asset.assetId)) {
    return null;
  }

  const assetId = asset.assetId as CaipAssetType;
  const parsed = parseCaipAssetType(assetId);
  const isNonEvm = isNonEvmChainId(parsed.chainId);
  const isNative = parsed.assetNamespace === 'slip44';

  const chainId = isNonEvm
    ? parsed.chainId
    : (formatChainIdToHex(parsed.chainId) as Hex);

  const price = getDiscoverAssetPrice(asset.price);

  return {
    path: buildAssetRoutePath(assetId),
    state: {
      token: {
        address: getDiscoverAssetAddress({
          assetId,
          isNative,
          isNonEvm,
          assetReference: parsed.assetReference,
        }),
        symbol: asset.symbol,
        name: asset.name || asset.symbol,
        chainId,
        image: asset.iconUrl ?? getCaipAssetImageUrl(assetId) ?? '',
        isNative,
        decimals: asset.decimals,
        ...(price === undefined ? {} : { price }),
      },
    },
  };
};
