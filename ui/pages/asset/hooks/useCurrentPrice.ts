import { AssetType, formatChainIdToCaip } from '@metamask/bridge-controller';
import { useQuery } from '@tanstack/react-query';
import {
  type SupportedCurrency,
  type V3SpotPricesResponse,
} from '@metamask/core-backend';
import { isCaipChainId } from '@metamask/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  useLiveAssetPrice,
  useWatchAssetPrice,
} from '../../../hooks/assets/market-stats-live-prices';
import { toChecksumHexAddress } from '../../../../shared/lib/hexstring-utils';
import { getCachedSpotPrice } from '../../../../shared/lib/token-price';
import { getCurrencyRates, getMarketData } from '../../../selectors';
import { getAssetsRates } from '../../../selectors/assets';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { apiClient } from '../../../helpers/api-client';
import { Asset } from '../types/asset';
import { isEvmChainId, toAssetId } from '../../../../shared/lib/asset-utils';
import { getNativeAssetForChainIdSafe } from '../../../ducks/bridge/utils';

/**
 * Market data for an asset, in the currently selected fiat currency.
 *
 * Field names match the cached market data shape in redux so that either source
 * can be consumed interchangeably.
 */
export type AssetMarketData = {
  marketCap?: number;
  totalVolume?: number;
  circulatingSupply?: number;
  allTimeHigh?: number;
  allTimeLow?: number;
  dilutedMarketCap?: number;
};

/**
 * `V3SpotPricesResponse` only types the handful of fields its existing callers
 * read. The endpoint returns the rest of these when `includeMarketData` is set.
 */
type SpotPriceEntry = NonNullable<V3SpotPricesResponse[string]> &
  AssetMarketData;

/**
 * Get cached spot prices from redux state
 *
 * @param asset - The asset to get the cached price of
 * @returns The cached price of the asset, or undefined if it is not in state.
 */
export const useCachedPrice = (asset: Asset): { currentPrice?: number } => {
  const evmMarketData = useSelector(getMarketData);
  const evmCurrencyRates = useSelector(getCurrencyRates);
  const nonEvmConversionRates = useSelector(getAssetsRates);

  const { chainId, type } = asset;

  return {
    currentPrice: getCachedSpotPrice({
      isNative: type === AssetType.native,
      symbol: asset.symbol,
      chainId,
      address: type === AssetType.token ? asset.address : undefined,
      marketData: evmMarketData,
      currencyRates: evmCurrencyRates,
      conversionRates: nonEvmConversionRates,
    }),
  };
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
): {
  currentPrice?: number;
  marketData?: AssetMarketData;
  assetId?: string;
} => {
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
    {
      currency: currency.toLowerCase() as SupportedCurrency,
      includeMarketData: true,
    },
  );

  const { data } = useQuery({
    ...queryOptions,
    enabled: enabled && Boolean(assetId),
    select: (response) => {
      if (!assetId) {
        return undefined;
      }

      const entry = (response?.[assetId] ??
        response?.[assetId.toLowerCase()]) as SpotPriceEntry | null | undefined;

      const marketData: AssetMarketData = {
        marketCap: entry?.marketCap,
        totalVolume: entry?.totalVolume,
        circulatingSupply: entry?.circulatingSupply,
        allTimeHigh: entry?.allTimeHigh,
        allTimeLow: entry?.allTimeLow,
        dilutedMarketCap: entry?.dilutedMarketCap,
      };

      const hasMarketData = Object.values(marketData).some(
        (value) => value !== undefined,
      );

      return {
        currentPrice:
          response?.[assetId]?.price ??
          response?.[assetId.toLowerCase()]?.price,
        marketData: hasMarketData ? marketData : undefined,
      };
    },
  });

  return {
    currentPrice: data?.currentPrice,
    marketData: data?.marketData,
    assetId,
  };
};

/**
 * Get the current price of an asset, along with market data when the price had
 * to be fetched.
 *
 * `marketData` is only populated from the API tier, because callers that need
 * cached market data read it from redux directly. It is therefore available
 * exactly when redux holds no cached price for the asset.
 *
 * @param asset - The asset to get the current price of
 * @returns The current price of the asset. If the asset is not found, or the price is not found, returns undefined.
 */
export const useCurrentPrice = (
  asset: Asset,
): { currentPrice?: number; marketData?: AssetMarketData } => {
  const { currentPrice: cachedPrice } = useCachedPrice(asset);
  const {
    currentPrice: spotPrice,
    marketData,
    assetId,
  } = useSpotPrice(asset, cachedPrice === undefined);
  const livePrice = useLiveAssetPrice(assetId);
  useWatchAssetPrice(assetId);

  return { currentPrice: livePrice ?? cachedPrice ?? spotPrice, marketData };
};
