import { useMemo } from 'react';
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
} from '../../../shared/lib/gator-permissions/gator-permissions-utils';
import { useAsyncResult } from '../useAsync';

export type { GatorTokenInfo } from '../../../shared/lib/gator-permissions/gator-permissions-utils';

export type UseGatorPermissionTokenInfoResult = {
  /**
   * Token information including symbol, decimals, name, and image
   */
  tokenInfo: GatorTokenInfo;
  /**
   * True when fetching token information
   */
  loading: boolean;
  /**
   * Error that occurred during fetch, if any
   */
  error: Error | null;
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
  const isNativeToken = permissionType?.includes('native-token') ?? false;

  // Handle native tokens using shared utility
  const nativeTokenInfo = useMemo(() => {
    if (!isNativeToken || !chainId) {
      return null;
    }

    return resolveNativeTokenInfo(chainId, networkConfigurationsByCaipChainId);
  }, [isNativeToken, chainId, networkConfigurationsByCaipChainId]);

  // Tier 1: Check cache and imported tokens (only for ERC-20 tokens) using shared utility
  const cachedOrImportedTokenInfo = useMemo(() => {
    if (isNativeToken || !tokenAddress || !chainId) {
      return null;
    }

    return lookupCachedOrImportedTokenInfo(
      tokenAddress,
      chainId,
      erc20TokensByChain,
      allTokens,
    );
  }, [tokenAddress, chainId, erc20TokensByChain, allTokens, isNativeToken]);

  // Determine if we should fetch token info
  const shouldFetch = Boolean(
    !isNativeToken && !cachedOrImportedTokenInfo && tokenAddress && chainId,
  );

  // Tier 2 & 3: Fetch using API and on-chain fallback if not in cache/imported (only for ERC-20 tokens)
  const asyncResult = useAsyncResult(async () => {
    if (!shouldFetch || !tokenAddress || !chainId) {
      return null;
    }

    // Fetch token info with API and on-chain fallback using shared utility
    return await getGatorErc20TokenInfo(
      tokenAddress,
      chainId,
      Boolean(allowExternalServices),
      getTokenStandardAndDetailsByChain,
    );
  }, [shouldFetch, tokenAddress, chainId, allowExternalServices]);

  // Extract fetched token info from async result
  const fetchedTokenInfo =
    asyncResult.status === 'success' ? asyncResult.value : null;
  const error = asyncResult.status === 'error' ? asyncResult.error : null;
  // Only consider it fetching if we actually should fetch
  const isFetching = shouldFetch && asyncResult.pending;

  // Determine the final token info and loading state
  // Prioritize: native > cached/imported > fetched > default
  const result = useMemo((): {
    tokenInfo: GatorTokenInfo;
    loading: boolean;
  } => {
    if (nativeTokenInfo) {
      return {
        tokenInfo: nativeTokenInfo,
        loading: false,
      };
    }

    if (cachedOrImportedTokenInfo) {
      return {
        tokenInfo: cachedOrImportedTokenInfo,
        loading: false,
      };
    }

    if (fetchedTokenInfo) {
      return {
        tokenInfo: fetchedTokenInfo,
        loading: false,
      };
    }

    return {
      tokenInfo: {
        symbol: 'Unknown Token',
        decimals: 18,
        chainId: chainId || ('0x0' as const),
      },
      loading: isFetching,
    };
  }, [
    nativeTokenInfo,
    cachedOrImportedTokenInfo,
    fetchedTokenInfo,
    chainId,
    isFetching,
  ]);

  return { ...result, error };
}
