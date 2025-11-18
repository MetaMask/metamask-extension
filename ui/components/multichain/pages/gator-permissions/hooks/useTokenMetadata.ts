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
  let parsed: number | null = null;
  if (typeof decimals === 'string') {
    parsed = decimals ? parseInt(decimals, 10) : null;
  } else {
    parsed = decimals ?? null;
  }

  return {
    symbol: symbol || UNKNOWN_TOKEN.symbol,
    decimals: parsed !== null && !Number.isNaN(parsed) ? parsed : null,
    name: name || symbol || UNKNOWN_TOKEN.name,
  };
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
    const abortController = new AbortController();
    let isMounted = true;

    const updateIfChanged = (newMetadata: TokenMetadata) => {
      if (!isMounted) {
        return;
      }
      setTokenMetadata((prev) =>
        prev.symbol !== newMetadata.symbol ||
        prev.decimals !== newMetadata.decimals ||
        prev.name !== newMetadata.name
          ? newMetadata
          : prev,
      );
    };

    // Handle native token case
    if (!tokenAddress) {
      updateIfChanged(stableNativeTokenMetadata);
      return () => {
        isMounted = false;
        abortController.abort();
      };
    }

    // Check cache first
    const cached = getCachedTokenMetadata(tokenAddress, chainId, tokensByChain);
    if (cached) {
      updateIfChanged(cached);
      return () => {
        isMounted = false;
        abortController.abort();
      };
    }

    // Fetch from API, then fall back to on-chain
    (async () => {
      if (abortController.signal.aborted) {
        return;
      }

      let metadata: TokenMetadata | null = null;

      // Try API first
      try {
        const apiMetadata = await fetchAssetMetadata(
          tokenAddress,
          chainId as Hex,
          undefined,
        );
        if (!abortController.signal.aborted && apiMetadata) {
          metadata = createTokenMetadata(
            apiMetadata.symbol,
            apiMetadata.decimals,
            apiMetadata.symbol,
          );
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }
        log.debug('Token API fetch failed, falling back to on-chain', {
          tokenAddress,
          chainId,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Fall back to on-chain if needed
      if (!metadata && !abortController.signal.aborted) {
        try {
          const details = await getTokenStandardAndDetailsByChain(
            tokenAddress,
            selectedAccount?.address,
            undefined,
            chainId,
          );
          if (!abortController.signal.aborted && details) {
            metadata = createTokenMetadata(
              details.symbol,
              details.decimals,
              details.name,
            );
          }
        } catch (error) {
          if (abortController.signal.aborted) {
            return;
          }
          log.error('Failed to fetch token metadata from on-chain', {
            tokenAddress,
            chainId,
            selectedAccountAddress: selectedAccount?.address,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (metadata && !abortController.signal.aborted) {
        updateIfChanged(metadata);
      }
    })();

    return () => {
      isMounted = false;
      abortController.abort();
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
