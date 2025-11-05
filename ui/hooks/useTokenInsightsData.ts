import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  formatChainIdToCaip,
  isNativeAddress as isNativeAddressFromBridge,
} from '@metamask/bridge-controller';
import { isCaipChainId, Hex } from '@metamask/utils';
import { isEvmChainId, toAssetId } from '../../shared/lib/asset-utils';
import { getMarketData, getTokenList, getCurrencyRates } from '../selectors';
import { getCurrentCurrency } from '../ducks/metamask/metamask';
import fetchWithCache from '../../shared/lib/fetch-with-cache';
import { formatCurrency } from '../helpers/utils/confirm-tx.util';
import { toChecksumHexAddress } from '../../shared/modules/hexstring-utils';

// Exported types
export type TokenInsightsToken = {
  address: string | null;
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

export type TokenListEntry =
  | {
      aggregators?: unknown[];
    }
  | undefined;

export type CurrencyRatesMap = Record<string, { conversionRate?: number }>;

export type TokenInsightsData = {
  // Market data in selected fiat currency
  priceFiat?: number;
  formattedPrice: string;
  pricePercentChange1d: number;
  volumeFiat?: number;
  marketCapFiat?: number;
  // Raw market data (for fallback)
  marketData: MarketData | null;
  // Verification status
  isVerified: boolean;
  aggregators: unknown[];
  // Token info
  isNativeToken: boolean;
  // Loading states
  isLoading: boolean;
  error: string | null;
  // Data source info
  hasEvmCache: boolean;
  baseCurrency?: string;
};

export const useTokenInsightsData = (
  token: TokenInsightsToken | null,
): TokenInsightsData => {
  const currentCurrency = useSelector(getCurrentCurrency) as string;
  const isEvm = token ? isEvmChainId(token.chainId as Hex) : false;

  // Get selectors data
  const marketDataState = useSelector(getMarketData) as
    | EvmMarketDataState
    | undefined;
  const currencyRates = useSelector(getCurrencyRates) as CurrencyRatesMap;
  const tokenList = useSelector(getTokenList) as
    | Record<string, TokenListEntry>
    | undefined;

  // Check if address is native
  const isNativeToken = useMemo(() => {
    if (!token?.address) {
      return false;
    }
    return isNativeAddressFromBridge(token.address);
  }, [token?.address]);

  // Get EVM market data from cache
  const evmMarketData = useMemo(() => {
    if (!token || !isEvm || !marketDataState) {
      return null;
    }
    // Use checksum address to match the modal's approach
    const checksumAddr = toChecksumHexAddress(token.address);
    const chainData = marketDataState[token.chainId as Hex];
    // Try both checksum and lowercase to ensure we find the data
    return (
      chainData?.[checksumAddr] || chainData?.[token.address.toLowerCase()]
    );
  }, [token, isEvm, marketDataState]);

  // Check token list data for verification status
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

  // Determine base currency for EVM conversion
  const baseCurrency = useMemo(() => {
    if (!isEvm) {
      return undefined;
    }
    if (isNativeToken) {
      return token?.symbol;
    }
    return evmMarketData?.currency;
  }, [isEvm, isNativeToken, token, evmMarketData]);

  const exchangeRate = baseCurrency
    ? currencyRates?.[baseCurrency]?.conversionRate
    : undefined;

  // Process and convert all market data
  const processedData = useMemo(() => {
    const hasEvmCache = Boolean(isEvm && evmMarketData);
    let priceFiat: number | undefined;
    let volumeFiat: number | undefined;
    let marketCapFiat: number | undefined;
    let pricePercentChange1d = 0;
    let marketData: MarketData | null = null;

    if (hasEvmCache) {
      // Use EVM cache data and convert to fiat
      if (isNativeToken) {
        priceFiat = token?.symbol
          ? currencyRates?.[token.symbol]?.conversionRate
          : undefined;
      } else if (
        exchangeRate !== undefined &&
        evmMarketData?.price !== undefined &&
        evmMarketData?.price !== null
      ) {
        priceFiat = exchangeRate * Number(evmMarketData.price);
      }

      if (
        exchangeRate !== undefined &&
        evmMarketData?.totalVolume !== undefined &&
        evmMarketData?.totalVolume !== null
      ) {
        volumeFiat = exchangeRate * Number(evmMarketData.totalVolume);
      }

      const evmMarketCapSource =
        evmMarketData?.dilutedMarketCap ?? evmMarketData?.marketCap;
      if (
        exchangeRate !== undefined &&
        evmMarketCapSource !== undefined &&
        evmMarketCapSource !== null
      ) {
        marketCapFiat = exchangeRate * Number(evmMarketCapSource);
      }

      pricePercentChange1d = evmMarketData?.pricePercentChange1d || 0;

      // Build marketData object for consistency
      marketData = {
        price: evmMarketData?.price,
        pricePercentChange1d: evmMarketData?.pricePercentChange1d,
        totalVolume: evmMarketData?.totalVolume,
        marketCap: evmMarketData?.marketCap,
        dilutedMarketCap: evmMarketData?.dilutedMarketCap,
      };
    } else if (apiData) {
      // Use API data (already in target currency)
      priceFiat = apiData.price;
      volumeFiat = apiData.totalVolume;
      marketCapFiat = apiData.dilutedMarketCap ?? apiData.marketCap;
      pricePercentChange1d = apiData.pricePercentChange1d || 0;
      marketData = apiData;
    }

    const formattedPrice = priceFiat
      ? formatCurrency(String(priceFiat), currentCurrency)
      : '—';

    return {
      priceFiat,
      formattedPrice,
      pricePercentChange1d,
      volumeFiat,
      marketCapFiat,
      marketData,
      hasEvmCache,
      baseCurrency,
    };
  }, [
    isEvm,
    evmMarketData,
    isNativeToken,
    token,
    currencyRates,
    exchangeRate,
    apiData,
    currentCurrency,
    baseCurrency,
  ]);

  return {
    ...processedData,
    isLoading,
    error,
    isVerified: (tokenListData?.aggregators?.length ?? 0) > 0,
    aggregators: tokenListData?.aggregators || [],
    isNativeToken,
  };
};
