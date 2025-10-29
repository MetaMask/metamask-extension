import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  formatChainIdToCaip,
  isNativeAddress as isNativeAddressFromBridge,
} from '@metamask/bridge-controller';
import { isCaipChainId, Hex } from '@metamask/utils';
import { isEvmChainId } from '../../shared/lib/asset-utils';
import { getMarketData, getTokenList } from '../selectors';
import { getCurrentCurrency } from '../ducks/metamask/metamask';
import { fetchWithCache } from '../../shared/lib/fetch-with-cache';
// TODO: Move this function to a shared location
const toAssetId = (address: string, chainId: string): string | null => {
  if (!address || !chainId) return null;
  return `${chainId}:${address.toLowerCase()}`;
};

export interface TokenInsightsToken {
  address: string;
  symbol: string;
  name?: string;
  chainId: string;
  iconUrl?: string;
}

export interface MarketData {
  price?: number;
  pricePercentChange1d?: number;
  totalVolume?: number;
  marketCap?: number;
  dilutedMarketCap?: number;
}

export const useTokenInsightsData = (token: TokenInsightsToken | null) => {
  const currentCurrency = useSelector(getCurrentCurrency);
  const isEvm = token ? isEvmChainId(token.chainId as Hex) : false;

  // Check TokenRatesController cache (EVM only)
  const marketDataState = useSelector(getMarketData);
  const evmMarketData = useMemo(() => {
    if (!token || !isEvm || !marketDataState) return null;
    const chainData = (marketDataState as any)[token.chainId as Hex];
    return chainData?.[token.address.toLowerCase()];
  }, [token, isEvm, marketDataState]);

  // Check token list data for verification status
  const tokenList = useSelector(getTokenList);
  const tokenListData = useMemo(() => {
    if (!token || !tokenList) return null;
    return (tokenList as any)[token.address.toLowerCase()];
  }, [token, tokenList]);

  // State for API fetched data
  const [apiData, setApiData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch from API if not in cache
  useEffect(() => {
    if (!token || evmMarketData) return;

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

        const url = `https://price.api.cx.metamask.io/v3/spot-prices?assetIds=${assetId}&includeMarketData=true&vsCurrency=${(currentCurrency as string).toLowerCase()}`;

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

  // Combine data sources
  const marketData = useMemo(() => {
    if (evmMarketData) {
      return {
        price: evmMarketData.price,
        pricePercentChange1d: evmMarketData.pricePercentChange1d,
        totalVolume: evmMarketData.allTimeHigh, // Note: EVM data might have different fields
        marketCap: evmMarketData.marketCap,
      };
    }
    return apiData;
  }, [evmMarketData, apiData]);

  // Check if address is native
  const isNativeToken = useMemo(() => {
    if (!token?.address) return false;
    return isNativeAddressFromBridge(token.address);
  }, [token?.address]);

  return {
    marketData,
    isLoading,
    error,
    isVerified: tokenListData?.aggregators?.length > 0,
    aggregators: tokenListData?.aggregators || [],
    isNativeToken,
  };
};
