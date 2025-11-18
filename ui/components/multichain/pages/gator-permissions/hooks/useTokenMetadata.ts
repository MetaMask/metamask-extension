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
};

const UNKNOWN_TOKEN: TokenMetadata = {
  symbol: 'Unknown Token',
  decimals: null,
};

/**
 * Normalized token metadata type from various sources
 */
type RawTokenMetadata = {
  symbol?: string;
  decimals?: number | string | null;
  name?: string;
};

/**
 * Get token metadata from tokensByChain cache
 *
 * @param tokenAddress - The token contract address
 * @param chainId - The chain ID
 * @param tokensByChain - Token metadata organized by chain from Redux state
 * @returns TokenMetadata if found in cache, null otherwise
 */
function getCachedTokenMetadata(
  tokenAddress: string,
  chainId: string,
  tokensByChain: Record<string, { data: Record<string, RawTokenMetadata> }>,
): TokenMetadata | null {
  const chainTokens = tokensByChain?.[chainId]?.data;
  if (!chainTokens) {
    return null;
  }

  // Try both lowercase and original casing
  const metadata =
    chainTokens[tokenAddress.toLowerCase()] ?? chainTokens[tokenAddress];

  if (metadata?.decimals === undefined) {
    return null;
  }

  return normalizeTokenMetadata(metadata);
}

/**
 * Normalize raw token metadata into a consistent format
 *
 * @param metadata - Raw metadata from various sources
 * @returns Normalized TokenMetadata object
 */
function normalizeTokenMetadata(metadata: RawTokenMetadata): TokenMetadata {
  const decimals = parseDecimals(metadata.decimals);

  return {
    symbol: metadata.symbol || UNKNOWN_TOKEN.symbol,
    decimals,
  };
}

/**
 * Parse decimals from various input formats
 *
 * @param decimals - Decimals as string, number, or null/undefined
 * @returns Parsed decimals or null if invalid
 */
function parseDecimals(
  decimals: string | number | null | undefined,
): number | null {
  if (decimals === null || decimals === undefined) {
    return null;
  }

  const parsed =
    typeof decimals === 'string' ? parseInt(decimals, 10) : decimals;

  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Fetch token metadata from API
 *
 * @param tokenAddress - Token contract address
 * @param chainId - Chain ID
 * @param signal - AbortController signal
 * @returns TokenMetadata or null if fetch fails
 */
async function fetchTokenMetadataFromAPI(
  tokenAddress: string,
  chainId: Hex,
  signal: AbortSignal,
): Promise<TokenMetadata | null> {
  try {
    const apiMetadata = await fetchAssetMetadata(
      tokenAddress,
      chainId,
      undefined,
    );

    if (signal.aborted || !apiMetadata) {
      return null;
    }

    return normalizeTokenMetadata(apiMetadata);
  } catch (error) {
    if (!signal.aborted) {
      log.debug('Token API fetch failed, falling back to on-chain', {
        tokenAddress,
        chainId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return null;
  }
}

/**
 * Fetch token metadata from on-chain
 *
 * @param tokenAddress - Token contract address
 * @param chainId - Chain ID
 * @param userAddress - User's address
 * @param signal - AbortController signal
 * @returns TokenMetadata or null if fetch fails
 */
async function fetchTokenMetadataFromOnChain(
  tokenAddress: string,
  chainId: string,
  userAddress: string | undefined,
  signal: AbortSignal,
): Promise<TokenMetadata | null> {
  try {
    const details = await getTokenStandardAndDetailsByChain(
      tokenAddress,
      userAddress,
      undefined,
      chainId,
    );

    if (signal.aborted || !details) {
      return null;
    }

    return normalizeTokenMetadata(details);
  } catch (error) {
    if (!signal.aborted) {
      log.error('Failed to fetch token metadata from on-chain', {
        tokenAddress,
        chainId,
        selectedAccountAddress: userAddress,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return null;
  }
}

/**
 * Custom hook to fetch token metadata for tokens.
 *
 * This hook attempts to fetch token information using the following strategy:
 * 1. First checks cache + user imported tokens from tokensByChain state
 * 2. If not found, calls the token API (fetchAssetMetadata)
 * 3. If API fails, falls back to on-chain data (getTokenStandardAndDetailsByChain)
 *
 * @param tokenAddress - The token contract address (undefined for native token)
 * @param chainId - The chain ID
 * @param tokensByChain - Token metadata organized by chain from Redux state
 * @param nativeTokenMetadata - Metadata to use when tokenAddress is undefined
 * @returns TokenMetadata with symbol and decimals
 */
export function useTokenMetadata(
  tokenAddress: string | undefined,
  chainId: string,
  tokensByChain: Record<string, { data: Record<string, RawTokenMetadata> }>,
  nativeTokenMetadata: TokenMetadata,
): TokenMetadata {
  const selectedAccount = useSelector(getSelectedAccount);

  // Stabilize native token metadata to prevent unnecessary re-renders
  const stableNativeTokenMetadata = useMemo(
    () => ({
      symbol: nativeTokenMetadata.symbol,
      decimals: nativeTokenMetadata.decimals,
    }),
    [nativeTokenMetadata.symbol, nativeTokenMetadata.decimals],
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

    function updateMetadataIfChanged(newMetadata: TokenMetadata): void {
      if (!isMounted) {
        return;
      }

      setTokenMetadata((prev) => {
        const hasChanged =
          prev.symbol !== newMetadata.symbol ||
          prev.decimals !== newMetadata.decimals;

        return hasChanged ? newMetadata : prev;
      });
    }

    async function fetchMetadata(): Promise<void> {
      // Handle native token case
      if (!tokenAddress) {
        updateMetadataIfChanged(stableNativeTokenMetadata);
        return;
      }

      // Check cache first
      const cached = getCachedTokenMetadata(
        tokenAddress,
        chainId,
        tokensByChain,
      );
      if (cached) {
        updateMetadataIfChanged(cached);
        return;
      }

      // Try API first
      const apiMetadata = await fetchTokenMetadataFromAPI(
        tokenAddress,
        chainId as Hex,
        abortController.signal,
      );

      if (apiMetadata) {
        updateMetadataIfChanged(apiMetadata);
        return;
      }

      // Fall back to on-chain
      const onChainMetadata = await fetchTokenMetadataFromOnChain(
        tokenAddress,
        chainId,
        selectedAccount?.address,
        abortController.signal,
      );

      if (onChainMetadata) {
        updateMetadataIfChanged(onChainMetadata);
      }
    }

    fetchMetadata();

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
}
