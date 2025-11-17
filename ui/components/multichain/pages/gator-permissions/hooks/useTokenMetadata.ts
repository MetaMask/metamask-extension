import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import log from 'loglevel';
import type { Hex } from '@metamask/utils';
import { getSelectedAccount } from '../../../../../selectors';
import { getTokenStandardAndDetailsByChain } from '../../../../../store/actions';
import { fetchAssetMetadata } from '../../../../../../shared/lib/asset-utils';

export type TokenMetadata = {
  symbol: string;
  decimals: number | null;
  name: string;
};

const UNKNOWN_TOKEN: TokenMetadata = {
  symbol: 'Unknown Token',
  decimals: null,
  name: 'Unknown Token',
};

/**
 * Helper to get token metadata from tokensByChain cache
 *
 * @param tokenAddress - The token contract address
 * @param chainId - The chain ID
 * @param tokensByChain - Token metadata organized by chain from Redux state
 * @returns TokenMetadata if found in cache, null otherwise
 */
const getCachedTokenMetadata = (
  tokenAddress: string,
  chainId: string,
  tokensByChain: Record<
    string,
    {
      data: Record<
        string,
        { symbol?: string; decimals?: number; name?: string }
      >;
    }
  >,
): TokenMetadata | null => {
  const tokenListForChain = tokensByChain?.[chainId]?.data || {};
  const foundTokenMetadata =
    tokenListForChain[tokenAddress.toLowerCase()] ??
    tokenListForChain[tokenAddress];

  if (foundTokenMetadata?.decimals !== undefined) {
    return {
      symbol: foundTokenMetadata.symbol || UNKNOWN_TOKEN.symbol,
      decimals: foundTokenMetadata.decimals,
      name: foundTokenMetadata.name || UNKNOWN_TOKEN.name,
    };
  }

  return null;
};

/**
 * Helper to create TokenMetadata from various sources
 *
 * @param symbol - Token symbol
 * @param decimals - Token decimals (can be string, number, or null)
 * @param name - Token name
 * @returns TokenMetadata object
 */
const createTokenMetadata = (
  symbol?: string,
  decimals?: number | string | null,
  name?: string,
): TokenMetadata => {
  let parsedDecimals: number | null = null;
  if (typeof decimals === 'string') {
    parsedDecimals = decimals ? parseInt(decimals, 10) : null;
  } else {
    parsedDecimals = decimals ?? null;
  }

  return {
    symbol: symbol || UNKNOWN_TOKEN.symbol,
    decimals:
      parsedDecimals !== null && !Number.isNaN(parsedDecimals)
        ? parsedDecimals
        : null,
    name: name || symbol || UNKNOWN_TOKEN.name,
  };
};

/**
 * Helper to update state only if values changed
 *
 * @param setTokenMetadata - State setter function
 * @param newMetadata - New metadata to set
 */
const updateMetadataIfChanged = (
  setTokenMetadata: React.Dispatch<React.SetStateAction<TokenMetadata>>,
  newMetadata: TokenMetadata,
) => {
  setTokenMetadata((prev) => {
    if (
      prev.symbol !== newMetadata.symbol ||
      prev.decimals !== newMetadata.decimals ||
      prev.name !== newMetadata.name
    ) {
      return newMetadata;
    }
    return prev;
  });
};

/**
 * Custom hook to fetch token metadata for tokens.
 *
 * This hook attempts to fetch token information using the following strategy:
 * 1. First checks cache + user imported tokens from tokensByChain state
 * (no external service calls needed)
 * 2. If not found, calls the token API (fetchAssetMetadata)
 * 3. If API fails, falls back to on-chain data (getTokenStandardAndDetailsByChain)
 *
 * @param tokenAddress - The token contract address (undefined for native token)
 * @param chainId - The chain ID
 * @param tokensByChain - Token metadata organized by chain from Redux state
 * @param nativeTokenMetadata - Metadata to use when tokenAddress is undefined
 * @returns TokenMetadata with symbol, decimals, and name
 */
export const useTokenMetadata = (
  tokenAddress: string | undefined,
  chainId: string,
  tokensByChain: Record<
    string,
    {
      data: Record<
        string,
        { symbol?: string; decimals?: number; name?: string }
      >;
    }
  >,
  nativeTokenMetadata: TokenMetadata,
): TokenMetadata => {
  const selectedAccount = useSelector(getSelectedAccount);

  // Memoize nativeTokenMetadata to prevent infinite loops when it's a new object reference
  // Create a new object only when the actual values change
  const stableNativeTokenMetadata = useMemo(
    () => ({
      symbol: nativeTokenMetadata.symbol,
      decimals: nativeTokenMetadata.decimals,
      name: nativeTokenMetadata.name,
    }),
    [
      nativeTokenMetadata.symbol,
      nativeTokenMetadata.decimals,
      nativeTokenMetadata.name,
    ],
  );

  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata>(() => {
    if (!tokenAddress) {
      return stableNativeTokenMetadata;
    }

    const cached = getCachedTokenMetadata(tokenAddress, chainId, tokensByChain);
    return cached ?? UNKNOWN_TOKEN;
  });

  useEffect(() => {
    let isMounted = true;

    if (!tokenAddress) {
      if (isMounted) {
        updateMetadataIfChanged(setTokenMetadata, stableNativeTokenMetadata);
      }
      return () => {
        isMounted = false;
      };
    }

    // Step 1: Check cache + user imported tokens (no external calls)
    const cached = getCachedTokenMetadata(tokenAddress, chainId, tokensByChain);
    if (cached) {
      if (isMounted) {
        updateMetadataIfChanged(setTokenMetadata, cached);
      }
      return () => {
        isMounted = false;
      };
    }

    // Step 2 & 3: Fetch from API, then fall back to on-chain
    const fetchTokenMetadata = async () => {
      let newMetadata: TokenMetadata | null = null;

      // Step 2: Try API first
      try {
        const apiMetadata = await fetchAssetMetadata(
          tokenAddress,
          chainId as Hex,
          undefined,
        );
        if (apiMetadata && isMounted) {
          // API doesn't return name, use symbol as fallback
          newMetadata = createTokenMetadata(
            apiMetadata.symbol,
            apiMetadata.decimals,
            apiMetadata.symbol,
          );
        }
      } catch (error) {
        log.debug('Token API fetch failed, falling back to on-chain', {
          tokenAddress,
          chainId,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Step 3: Fall back to on-chain if API didn't return metadata
      if (!newMetadata && isMounted) {
        try {
          const details = await getTokenStandardAndDetailsByChain(
            tokenAddress,
            selectedAccount?.address,
            undefined,
            chainId,
          );

          if (details) {
            newMetadata = createTokenMetadata(
              details.symbol,
              details.decimals,
              details.name,
            );
          }
        } catch (error) {
          log.error('Failed to fetch token metadata from on-chain', {
            tokenAddress,
            chainId,
            selectedAccountAddress: selectedAccount?.address,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Update state if we got metadata
      if (isMounted && newMetadata) {
        updateMetadataIfChanged(setTokenMetadata, newMetadata);
      }
    };

    fetchTokenMetadata();

    return () => {
      isMounted = false;
    };
  }, [
    tokenAddress,
    chainId,
    tokensByChain,
    stableNativeTokenMetadata,
    selectedAccount,
  ]);

  return tokenMetadata;
};
