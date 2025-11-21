import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Hex,
  KnownCaipNamespace,
  CaipChainId,
  hexToNumber,
} from '@metamask/utils';
import log from 'loglevel';
import {
  getAllTokens,
  selectERC20TokensByChain,
  getUseExternalServices,
} from '../../selectors/selectors';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../shared/modules/selectors/networks';
import { getTokenStandardAndDetailsByChain } from '../../store/actions';
import { fetchAssetMetadata } from '../../../shared/lib/asset-utils';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../../../shared/constants/network';

export type TokenInfo = {
  symbol: string;
  decimals: number;
  name?: string;
  image?: string;
  address?: string;
  chainId: Hex;
};

export type UseGatorPermissionTokenInfoResult = {
  /**
   * Token information including symbol, decimals, name, and image
   */
  tokenInfo: TokenInfo;
  /**
   * True when fetching token information
   */
  loading: boolean;
  /**
   * Error that occurred during fetch, if any
   */
  error: Error | null;
  /**
   * The source from which token info was retrieved
   * - 'native': Native token from network configuration
   * - 'cache': From tokensChainsCache (API cache)
   * - 'imported': From user's imported tokens
   * - 'api': From external API
   * - 'onchain': From on-chain data
   */
  source: 'native' | 'cache' | 'imported' | 'api' | 'onchain' | null;
};

// Promise cache to dedupe concurrent requests for the same token
// Exported for testing purposes
export const tokenInfoPromiseCache = new Map<string, Promise<TokenInfo>>();

/**
 * Fetch token info from API with fallback to on-chain data.
 *
 * @param address - Token address
 * @param chainId - Chain ID in hex format
 * @param allowExternalServices - Whether to use external API services
 * @returns Token information with source indicator
 */
async function fetchTokenInfoWithFallback(
  address: string,
  chainId: Hex,
  allowExternalServices: boolean,
): Promise<{ tokenInfo: TokenInfo; source: 'api' | 'onchain' }> {
  const cacheKey = `${chainId}:${address.toLowerCase()}`;

  // Check if there's already a request in flight and await it
  const existingPromise = tokenInfoPromiseCache.get(cacheKey);
  if (existingPromise) {
    const tokenInfo = await existingPromise;
    // Determine source from cached data (if it has image, likely from API)
    return {
      tokenInfo,
      source: tokenInfo.image ? 'api' : 'onchain',
    };
  }

  // Create a promise for this fetch operation
  const fetchPromise = (async () => {
    let symbol: string | undefined;
    let decimals: number | undefined;
    let name: string | undefined;
    let image: string | undefined;

    // Tier 1: Try API if external services are allowed
    if (allowExternalServices) {
      try {
        const metadata = await fetchAssetMetadata(address, chainId);
        if (metadata) {
          symbol = metadata.symbol;
          decimals = metadata.decimals;
          // Note: fetchAssetMetadata returns 'address' and 'image', not 'name'
          image = metadata.image;
        }
      } catch (error) {
        log.warn('Failed to fetch token metadata from API', {
          address,
          chainId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Tier 2: Fall back to on-chain data if needed
    if (!symbol || decimals === null || decimals === undefined) {
      try {
        const details = await getTokenStandardAndDetailsByChain(
          address,
          undefined,
          undefined,
          chainId,
        );

        const decRaw = details?.decimals as string | number | undefined;
        if (typeof decRaw === 'number') {
          decimals = decRaw;
        } else if (typeof decRaw === 'string') {
          // Handle hex strings (with 0x prefix) or decimal strings
          const trimmed = decRaw.trim();
          let parsed: number;

          if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
            // Parse as hex (strip the 0x prefix)
            parsed = parseInt(trimmed.slice(2), 16);
          } else {
            // Parse as decimal
            parsed = parseInt(trimmed, 10);
          }

          // Only accept valid, finite, non-negative integers
          if (Number.isFinite(parsed) && parsed >= 0) {
            decimals = parsed;
          }
        }
        symbol = details?.symbol ?? symbol;
      } catch (error) {
        log.error('Failed to fetch token details from blockchain', {
          address,
          chainId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const tokenInfo: TokenInfo = {
      symbol: symbol || 'Unknown Token',
      decimals: decimals ?? 18,
      name,
      image,
      address,
      chainId,
    };

    return tokenInfo;
  })();

  // Cache the promise
  tokenInfoPromiseCache.set(cacheKey, fetchPromise);

  const tokenInfo = await fetchPromise;
  // Determine source based on whether we have image data (typically from API)
  const source: 'api' | 'onchain' = tokenInfo.image ? 'api' : 'onchain';

  return { tokenInfo, source };
}

/**
 * Hook to fetch token information with a multi-tier fallback strategy:
 * 1. Handle native tokens if permissionType contains 'native-token'
 * 2. Check cache (tokensChainsCache) and user imported tokens
 * 3. Fall back to API call (if external services enabled)
 * 4. Fall back to on-chain data
 *
 * @param tokenAddress - The token contract address (undefined for native tokens)
 * @param chainId - The chain ID in hex format
 * @param permissionType - Optional permission type to detect native tokens
 * @returns Token information with loading and error states
 */
export function useGatorPermissionTokenInfo(
  tokenAddress: string | undefined,
  chainId: Hex | undefined,
  permissionType?: string,
): UseGatorPermissionTokenInfoResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fetchedTokenInfo, setFetchedTokenInfo] = useState<{
    tokenInfo: TokenInfo;
    source: 'api' | 'onchain';
  } | null>(null);

  // Get cached tokens from tokensChainsCache (API cache)
  const erc20TokensByChain = useSelector(selectERC20TokensByChain);

  // Get user's imported tokens
  const allTokens = useSelector(getAllTokens);

  // Get external services preference
  const allowExternalServices = useSelector(getUseExternalServices);

  // Get network configurations for native token handling
  const networkConfigurationsByCaipChainId = useSelector(
    getAllNetworkConfigurationsByCaipChainId,
  );

  // Check if this is a native token
  const isNativeToken = useMemo(() => {
    return permissionType?.includes('native-token') ?? false;
  }, [permissionType]);

  // Handle native tokens
  const nativeTokenInfo = useMemo(() => {
    if (!isNativeToken || !chainId) {
      return null;
    }

    const caipChainId: CaipChainId = `${KnownCaipNamespace.Eip155}:${hexToNumber(chainId)}`;
    const networkConfig = networkConfigurationsByCaipChainId?.[caipChainId];

    const nativeSymbol =
      networkConfig?.nativeCurrency ||
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
        chainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
      ] ||
      'ETH';

    return {
      tokenInfo: {
        symbol: nativeSymbol,
        decimals: 18,
        chainId,
      },
      source: 'native' as const,
    };
  }, [isNativeToken, chainId, networkConfigurationsByCaipChainId]);

  // Tier 1: Check cache and imported tokens (only for ERC-20 tokens)
  const cachedOrImportedTokenInfo = useMemo(() => {
    // Skip if native token
    if (isNativeToken) {
      return null;
    }

    if (!tokenAddress || !chainId) {
      return null;
    }

    const normalizedAddress = tokenAddress.toLowerCase();

    // Check tokensChainsCache first (API cache)
    const cachedToken = erc20TokensByChain[chainId]?.data?.[normalizedAddress];
    if (cachedToken) {
      return {
        tokenInfo: {
          symbol: cachedToken.symbol,
          decimals: cachedToken.decimals,
          name: cachedToken.name,
          image: cachedToken.iconUrl,
          address: tokenAddress,
          chainId,
        },
        source: 'cache' as const,
      };
    }

    // Check user's imported tokens
    const importedTokens = allTokens?.[chainId];
    if (importedTokens) {
      // allTokens structure: { [chainId]: { [address]: Token[] } }
      for (const accountTokens of Object.values(importedTokens)) {
        if (Array.isArray(accountTokens)) {
          const foundToken = accountTokens.find(
            (token) => token.address?.toLowerCase() === normalizedAddress,
          );
          if (foundToken) {
            return {
              tokenInfo: {
                symbol: foundToken.symbol,
                decimals: foundToken.decimals,
                name: foundToken.name,
                image: foundToken.image,
                address: tokenAddress,
                chainId,
              },
              source: 'imported' as const,
            };
          }
        }
      }
    }

    return null;
  }, [tokenAddress, chainId, erc20TokensByChain, allTokens, isNativeToken]);

  // Tier 2 & 3: Fetch using API and on-chain fallback if not in cache/imported (only for ERC-20 tokens)
  useEffect(() => {
    let cancelled = false;

    const fetchTokenInfo = async () => {
      // If this is a native token, no need to fetch
      if (isNativeToken) {
        setFetchedTokenInfo(null);
        setLoading(false);
        setError(null);
        return;
      }

      // If we found it in cache or imported tokens, no need to fetch
      if (cachedOrImportedTokenInfo) {
        setFetchedTokenInfo(null);
        setLoading(false);
        setError(null);
        return;
      }

      if (!tokenAddress || !chainId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch token info with API and on-chain fallback
        const result = await fetchTokenInfoWithFallback(
          tokenAddress,
          chainId,
          Boolean(allowExternalServices),
        );

        if (!cancelled) {
          setFetchedTokenInfo(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setFetchedTokenInfo(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTokenInfo();

    return () => {
      cancelled = true;
    };
  }, [
    tokenAddress,
    chainId,
    cachedOrImportedTokenInfo,
    allowExternalServices,
    isNativeToken,
  ]);

  // Determine the final token info and source
  const result = useMemo(() => {
    // Prioritize native token info
    if (nativeTokenInfo) {
      return {
        tokenInfo: nativeTokenInfo.tokenInfo,
        source: nativeTokenInfo.source,
      };
    }

    if (cachedOrImportedTokenInfo) {
      return {
        tokenInfo: cachedOrImportedTokenInfo.tokenInfo,
        source: cachedOrImportedTokenInfo.source,
      };
    }

    if (fetchedTokenInfo) {
      return {
        tokenInfo: fetchedTokenInfo.tokenInfo,
        source: fetchedTokenInfo.source,
      };
    }

    return {
      tokenInfo: {
        symbol: 'Unknown Token',
        decimals: 18,
        chainId: chainId || '0x0',
      },
      source: null,
    };
  }, [nativeTokenInfo, cachedOrImportedTokenInfo, fetchedTokenInfo, chainId]);

  return {
    tokenInfo: result.tokenInfo,
    loading,
    error,
    source: result.source,
  };
}
