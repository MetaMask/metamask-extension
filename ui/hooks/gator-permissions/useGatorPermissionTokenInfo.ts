import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import {
  getAllTokens,
  selectERC20TokensByChain,
  getUseExternalServices,
} from '../../selectors/selectors';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../shared/modules/selectors/networks';
import { getTokenStandardAndDetailsByChain } from '../../store/actions';
import {
  resolveNativeTokenInfo,
  lookupCachedOrImportedTokenInfo,
  getGatorErc20TokenInfo,
  type GatorTokenInfo,
  type CachedTokensByChain,
  type ImportedTokensByChain,
  type NetworkConfigurationsByCaipChainId,
} from '../../../shared/lib/gator-permissions/gator-permissions-utils';

// Re-export GatorTokenInfo as TokenInfo for backward compatibility
export type TokenInfo = GatorTokenInfo;

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

  // Handle native tokens using shared utility
  const nativeTokenInfo = useMemo(() => {
    if (!isNativeToken || !chainId) {
      return null;
    }

    return {
      tokenInfo: resolveNativeTokenInfo(
        chainId,
        networkConfigurationsByCaipChainId as NetworkConfigurationsByCaipChainId,
      ),
      source: 'native' as const,
    };
  }, [isNativeToken, chainId, networkConfigurationsByCaipChainId]);

  // Tier 1: Check cache and imported tokens (only for ERC-20 tokens) using shared utility
  const cachedOrImportedTokenInfo = useMemo(() => {
    // Skip if native token
    if (isNativeToken) {
      return null;
    }

    if (!tokenAddress || !chainId) {
      return null;
    }

    // First check cache to determine source
    const normalizedAddress = tokenAddress.toLowerCase();
    const cachedToken = erc20TokensByChain[chainId]?.data?.[normalizedAddress];

    // Look up token info (handles both cache and imported tokens)
    const tokenInfo = lookupCachedOrImportedTokenInfo(
      tokenAddress,
      chainId,
      erc20TokensByChain as CachedTokensByChain,
      allTokens as ImportedTokensByChain,
    );

    if (!tokenInfo) {
      return null;
    }

    // Determine source based on whether it was found in cache
    const source: 'cache' | 'imported' = cachedToken ? 'cache' : 'imported';

    return {
      tokenInfo,
      source,
    };
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

        // Fetch token info with API and on-chain fallback using shared utility
        const tokenInfo = await getGatorErc20TokenInfo(
          tokenAddress,
          chainId,
          Boolean(allowExternalServices),
          getTokenStandardAndDetailsByChain,
        );

        if (!cancelled) {
          // Determine source based on whether we have image data (typically from API)
          const source: 'api' | 'onchain' = tokenInfo.image ? 'api' : 'onchain';
          setFetchedTokenInfo({ tokenInfo, source });
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
