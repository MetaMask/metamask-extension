import {
  type CaipAssetType,
  type CaipChainId,
  type Hex,
  isCaipAssetType,
  parseCaipAssetType,
} from '@metamask/utils';
import type { TokenAsset } from '@metamask/assets-controllers';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';

import { useTokenAssetQuery } from '#ui/hooks/token-asset/useTokenAssetQuery';
import { decimalToPrefixedHex } from '#shared/lib/conversion.utils';
import {
  getCaipAssetImageUrl,
  isEvmChainId,
  isNativeCaipAssetId,
} from '#shared/lib/asset-utils';
import {
  Token,
  TokenWithFiatAmount,
} from '../../../components/app/assets/types';

export type LocationStateToken = {
  address: string;
  symbol: string;
  name: string;
  chainId: string;
  image?: string;
  isNative?: boolean;
  decimals: number;
};

type UseRouteAssetTokenParams = {
  ownedToken?: TokenWithFiatAmount | Token | null;
  locationStateToken?: LocationStateToken;
  assetId?: CaipAssetType;
};

function getNativeToken(assetId: CaipAssetType) {
  try {
    const parsed = parseCaipAssetType(assetId);
    const native = getNativeAssetForChainId(parsed.chainId);
    const image = native.iconUrl ?? getCaipAssetImageUrl(assetId) ?? '';

    if (!isEvmChainId(parsed.chainId)) {
      return {
        address: assetId,
        symbol: native.symbol,
        name: native.name ?? native.symbol,
        chainId: parsed.chainId,
        decimals: native.decimals,
        image,
        isNative: true,
      };
    }

    return {
      address: '' as Hex,
      symbol: native.symbol,
      name: native.name ?? native.symbol,
      chainId: decimalToPrefixedHex(parsed.chain.reference) as Hex,
      decimals: native.decimals,
      image,
      isNative: true,
    };
  } catch {
    return undefined;
  }
}

function mapToRouteToken(assetId: CaipAssetType, token: TokenAsset) {
  const parsed = parseCaipAssetType(assetId);
  const { chainId: caipChainId, assetReference } = parsed;
  const image = getCaipAssetImageUrl(assetId) ?? '';
  const isNative = isNativeCaipAssetId(assetId);

  if (!isEvmChainId(caipChainId)) {
    return {
      address: assetId,
      symbol: token.symbol,
      name: token.name,
      chainId: caipChainId as CaipChainId,
      decimals: token.decimals,
      image,
      isNative,
    };
  }

  const hexChainId = decimalToPrefixedHex(parsed.chain.reference) as Hex;

  return {
    address: (isNative ? '' : assetReference) as Hex,
    symbol: token.symbol,
    name: token.name,
    chainId: hexChainId,
    decimals: token.decimals,
    image,
    isNative,
  };
}

export const useRouteAssetToken = ({
  ownedToken,
  locationStateToken,
  assetId,
}: UseRouteAssetTokenParams) => {
  const hasResolvedToken = Boolean(ownedToken || locationStateToken);
  const isValidAssetId = Boolean(assetId && isCaipAssetType(assetId));
  const shouldFetchNative =
    !hasResolvedToken &&
    isValidAssetId &&
    isNativeCaipAssetId(assetId as CaipAssetType);
  const shouldFetchTokenAsset =
    !hasResolvedToken && isValidAssetId && !shouldFetchNative;

  const nativeToken = shouldFetchNative
    ? getNativeToken(assetId as CaipAssetType)
    : undefined;

  const {
    data: tokenAsset,
    isLoading: tokenAssetLoading,
    error: tokenAssetError,
  } = useTokenAssetQuery({
    assetId,
    fetchOnMiss: shouldFetchTokenAsset,
    enabled: shouldFetchTokenAsset,
  });

  const fetchedFromAsset =
    tokenAsset && isValidAssetId
      ? mapToRouteToken(assetId as CaipAssetType, tokenAsset)
      : undefined;

  const token =
    ownedToken ?? locationStateToken ?? nativeToken ?? fetchedFromAsset;

  return {
    token,
    isLoading: Boolean(shouldFetchTokenAsset && tokenAssetLoading),
    hasError:
      (shouldFetchNative && !nativeToken) ||
      (shouldFetchTokenAsset && Boolean(tokenAssetError)),
  };
};

export type RouteAssetToken = Token | LocationStateToken | TokenWithFiatAmount;

export const getRouteAssetChainId = (
  token: RouteAssetToken | undefined,
  chainId?: Hex | CaipChainId,
): Hex | CaipChainId | undefined =>
  (token?.chainId ?? chainId) as Hex | CaipChainId | undefined;
