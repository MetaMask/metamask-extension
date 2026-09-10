import { AssetType, formatChainIdToCaip } from '@metamask/bridge-controller';
import { useQuery } from '@tanstack/react-query';
import { type SupportedCurrency } from '@metamask/core-backend';
import { CaipAssetType, Hex, isCaipChainId } from '@metamask/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toChecksumHexAddress } from '../../../../shared/lib/hexstring-utils';
import { getCurrencyRates, getMarketData } from '../../../selectors';
import { getAssetsRates } from '../../../selectors/assets';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { apiClient } from '../../../helpers/api-client';
import { Asset } from '../types/asset';
import { isEvmChainId, toAssetId } from '../../../../shared/lib/asset-utils';
import { getNativeAssetForChainIdSafe } from '../../../ducks/bridge/utils';

/**
 * Get cached spot prices from redux state
 *
 * @param asset - The asset to get the cached price of
 * @returns The cached price of the asset, or undefined if it is not in state.
 */
const useCachedPrice = (asset: Asset): { currentPrice?: number } => {
  const isEvm = isEvmChainId(asset.chainId);
  const evmMarketData = useSelector(getMarketData);
  const evmCurrencyRates = useSelector(getCurrencyRates);
  const nonEvmConversionRates = useSelector(getAssetsRates);

  const { chainId, type } = asset;

  if (isEvm) {
    if (type === AssetType.native) {
      return {
        currentPrice:
          evmCurrencyRates[asset.symbol]?.conversionRate ?? undefined,
      };
    }

    // Market and conversion rate data
    const address = toChecksumHexAddress(asset.address) as Hex;
    const tokenMarketPrice = evmMarketData[chainId]?.[address]?.price;
    const baseCurrency = evmMarketData[chainId]?.[address]?.currency;
    const tokenExchangeRate =
      evmCurrencyRates[baseCurrency]?.conversionRate ?? undefined;

    const currentPrice =
      tokenExchangeRate !== undefined && tokenMarketPrice !== undefined
        ? tokenExchangeRate * tokenMarketPrice
        : undefined;

    return { currentPrice };
  }

  // Format normalization in isEvmChainId should prevent most errors, but using safe wrapper as defensive fallback
  const assetId =
    type === AssetType.token
      ? asset.address
      : getNativeAssetForChainIdSafe(chainId)?.assetId;

  // If we can't get the assetId for a native token (unsupported chain), return undefined price
  if (!assetId && type === AssetType.native) {
    return { currentPrice: undefined };
  }

  const currentPriceAsString =
    nonEvmConversionRates?.[assetId as CaipAssetType]?.rate;

  const currentPrice = currentPriceAsString
    ? parseFloat(currentPriceAsString)
    : undefined;

  return { currentPrice };
};

/**
 * Get spot prices from our APIs
 *
 * @param asset - The asset to get the spot price of
 * @param enabled - Whether to fetch. Pass false when a cached price is available.
 * @returns The spot price of the asset, or undefined while loading or if unavailable.
 */
const useSpotPrice = (
  asset: Asset,
  enabled: boolean,
): { currentPrice?: number } => {
  const currency = useSelector(getCurrentCurrency);
  const isEvm = isEvmChainId(asset.chainId);
  const { chainId, type } = asset;

  const assetId = useMemo(() => {
    if (type === AssetType.native) {
      return getNativeAssetForChainIdSafe(chainId)?.assetId;
    }

    const caipChainId = isCaipChainId(chainId)
      ? chainId
      : formatChainIdToCaip(chainId);
    const address = isEvm ? toChecksumHexAddress(asset.address) : asset.address;

    return toAssetId(address, caipChainId);
  }, [asset, chainId, isEvm, type]);

  const queryOptions = apiClient.prices.getV3SpotPricesQueryOptions(
    assetId ? [assetId] : [],
    { currency: currency.toLowerCase() as SupportedCurrency },
  );

  const { data: currentPrice } = useQuery({
    ...queryOptions,
    enabled: enabled && Boolean(assetId),
    select: (response) =>
      assetId
        ? (response?.[assetId]?.price ??
          response?.[assetId.toLowerCase()]?.price)
        : undefined,
  });

  return { currentPrice };
};

/**
 * Get the current price of an asset.
 *
 * @param asset - The asset to get the current price of
 * @returns The current price of the asset. If the asset is not found, or the price is not found, returns undefined.
 */
export const useCurrentPrice = (asset: Asset): { currentPrice?: number } => {
  const { currentPrice: cachedPrice } = useCachedPrice(asset);
  const { currentPrice: spotPrice } = useSpotPrice(
    asset,
    cachedPrice === undefined,
  );

  return { currentPrice: cachedPrice ?? spotPrice };
};
