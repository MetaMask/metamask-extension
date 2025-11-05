import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  formatChainIdToCaip,
  isNativeAddress as isNativeAddressFromBridge,
} from '@metamask/bridge-controller';
import { isCaipChainId, Hex } from '@metamask/utils';
import { isEvmChainId, toAssetId } from '../../shared/lib/asset-utils';
import { getMarketData, getTokenList } from '../selectors';
import { getCurrentCurrency } from '../ducks/metamask/metamask';
import { getCurrencyRates } from '../selectors/selectors';
import fetchWithCache from '../../shared/lib/fetch-with-cache';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import { formatCompactCurrency } from '../helpers/utils/token-insights';

export type TokenInsightsToken = {
  address: string;
  symbol: string;
  name?: string;
  chainId: string;
  iconUrl?: string;
};

export type MarketData = {
  price?: number;
  pricePercentChange1d?: number;
  totalVolume?: number;
  marketCap?: number;
  dilutedMarketCap?: number;
};

export type EvmMarketTokenData = {
  price?: number;
  pricePercentChange1d?: number;
  totalVolume?: number;
  marketCap?: number;
  dilutedMarketCap?: number;
  currency?: string;
};

export type EvmMarketDataState = Record<
  Hex,
  Record<string, EvmMarketTokenData>
>;

export type CurrencyRatesMap = Record<string, { conversionRate?: number }>;

export type TokenInsightsData = {
  marketData: MarketData | null;
  marketDataFiat: {
    price?: number;
    volume?: number;
    marketCap?: number;
    formattedPrice: string;
    formattedVolume: string;
    formattedMarketCap: string;
  };
  isLoading: boolean;
  error: string | null;
  isVerified: boolean;
  aggregators: unknown[];
  isNativeToken: boolean;
};

export const useTokenInsightsData = (
  token: TokenInsightsToken | null,
): TokenInsightsData => {
  const currentCurrency = useSelector(getCurrentCurrency) as string;
  const currencyRates = useSelector(getCurrencyRates) as CurrencyRatesMap;
  const isEvm = token ? isEvmChainId(token.chainId as Hex) : false;

  // Check TokenRatesController cache (EVM only)
  const marketDataState = useSelector(getMarketData) as
    | EvmMarketDataState
    | undefined;

  const evmMarketData = useMemo(() => {
    if (!token || !isEvm || !marketDataState) {
      return null;
    }
    const chainData = marketDataState[token.chainId as Hex];
    // Normalize address to lowercase for consistent lookups
    return chainData?.[token.address.toLowerCase()] || null;
  }, [token, isEvm, marketDataState]);

  // Check token list data for verification status
  type TokenListEntry = { aggregators?: unknown[] } | undefined;
  const tokenList = useSelector(getTokenList) as
    | Record<string, TokenListEntry>
    | undefined;
  const tokenListData = useMemo(() => {
    if (!token || !tokenList) {
      return null;
    }
    return tokenList[token.address.toLowerCase()] ?? null;
  }, [token, tokenList]);

  // State for API fetched data
  const [apiData, setApiData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if address is native
  const isNativeToken = useMemo(() => {
    if (!token?.address) {
      return false;
    }
    return isNativeAddressFromBridge(token.address);
  }, [token?.address]);

  // Determine base currency for EVM tokens
  const baseCurrency = useMemo(() => {
    if (!isEvm || !evmMarketData) {
      return undefined;
    }
    if (isNativeToken) {
      return token?.symbol;
    }
    return evmMarketData.currency;
  }, [isEvm, isNativeToken, token, evmMarketData]);

  const exchangeRate = baseCurrency
    ? currencyRates?.[baseCurrency]?.conversionRate
    : undefined;

  // Fetch from API if not in cache
  useEffect(() => {
    if (!token || evmMarketData) {
      return;
    }

    const fetchMarketData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const caipChainId = isCaipChainId(token.chainId)
          ? token.chainId
          : formatChainIdToCaip(token.chainId as Hex);
        const assetId = toAssetId(token.address, caipChainId);

        if (!assetId) {
          throw new Error('Invalid asset ID');
        }

        const url = `https://price.api.cx.metamask.io/v3/spot-prices?assetIds=${assetId}&includeMarketData=true&vsCurrency=${currentCurrency.toLowerCase()}`;

        const response = await fetchWithCache({
          url,
          cacheOptions: { cacheRefreshTime: 30 * 1000 }, // 30 seconds
          functionName: 'fetchTokenInsightsData',
          fetchOptions: {
            headers: { 'X-Client-Id': 'extension' },
          },
        });

        const tokenData = response?.[assetId];
        if (tokenData) {
          // Handle different response formats
          const marketData: MarketData = {
            price: tokenData.price || tokenData.usd,
            pricePercentChange1d:
              tokenData.pricePercentChange1d ||
              tokenData.pricePercentChange?.P1D ||
              0,
            totalVolume: tokenData.totalVolume,
            marketCap: tokenData.marketCap,
            dilutedMarketCap: tokenData.dilutedMarketCap,
          };
          setApiData(marketData);
        }
      } catch (err) {
        console.error('Failed to fetch token insights:', err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketData();
  }, [token, evmMarketData, currentCurrency]);

  // Combine data sources and convert to fiat for EVM tokens
  const marketData = useMemo(() => {
    if (evmMarketData) {
      return {
        price: evmMarketData.price,
        pricePercentChange1d: evmMarketData.pricePercentChange1d,
        totalVolume: evmMarketData.totalVolume,
        marketCap: evmMarketData.marketCap,
        dilutedMarketCap:
          // Prefer dilutedMarketCap when available to mirror other sources
          evmMarketData.dilutedMarketCap ?? evmMarketData.marketCap,
      };
    }
    return apiData;
  }, [evmMarketData, apiData]);

  // Calculate fiat values and formatted strings
  const marketDataFiat = useMemo(() => {
    // For non-EVM tokens or when no exchange rate, use direct values
    if (!isEvm || !evmMarketData || !exchangeRate) {
      const price = marketData?.price;
      const volume = marketData?.totalVolume;
      const marketCap = marketData?.dilutedMarketCap ?? marketData?.marketCap;

      return {
        price,
        volume,
        marketCap,
        formattedPrice: price
          ? formatCurrency(String(price), currentCurrency)
          : '—',
        formattedVolume: formatCompactCurrency(volume, currentCurrency),
        formattedMarketCap: formatCompactCurrency(marketCap, currentCurrency),
      };
    }

    // For EVM tokens with native currency rates, convert to fiat
    let priceFiat: number | undefined;
    if (isNativeToken && token?.symbol) {
      priceFiat = currencyRates?.[token.symbol]?.conversionRate;
    } else if (
      evmMarketData.price !== undefined &&
      evmMarketData.price !== null
    ) {
      priceFiat = exchangeRate * Number(evmMarketData.price);
    } else {
      priceFiat = undefined;
    }

    const volumeFiat =
      evmMarketData.totalVolume !== undefined &&
      evmMarketData.totalVolume !== null
        ? exchangeRate * Number(evmMarketData.totalVolume)
        : undefined;

    const marketCapSource =
      evmMarketData.dilutedMarketCap ?? evmMarketData.marketCap;
    const marketCapFiat =
      marketCapSource !== undefined && marketCapSource !== null
        ? exchangeRate * Number(marketCapSource)
        : undefined;

    return {
      price: priceFiat,
      volume: volumeFiat,
      marketCap: marketCapFiat,
      formattedPrice: priceFiat
        ? formatCurrency(String(priceFiat), currentCurrency)
        : '—',
      formattedVolume: formatCompactCurrency(volumeFiat, currentCurrency),
      formattedMarketCap: formatCompactCurrency(marketCapFiat, currentCurrency),
    };
  }, [
    marketData,
    isEvm,
    evmMarketData,
    exchangeRate,
    isNativeToken,
    token,
    currencyRates,
    currentCurrency,
  ]);

  return {
    marketData,
    marketDataFiat,
    isLoading,
    error,
    isVerified: (tokenListData?.aggregators?.length ?? 0) > 0,
    aggregators: tokenListData?.aggregators || [],
    isNativeToken,
  };
};
