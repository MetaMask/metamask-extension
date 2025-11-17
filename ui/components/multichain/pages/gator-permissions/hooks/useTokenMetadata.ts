import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import log from 'loglevel';
import { getSelectedAccount } from '../../../../../selectors';
import { getTokenStandardAndDetailsByChain } from '../../../../../store/actions';

export type TokenMetadata = {
  symbol: string;
  decimals: number | null;
  name: string;
};

/**
 * Custom hook to fetch token metadata for tokens.
 *
 * This hook attempts to fetch token information using the following strategy:
 * 1. First checks if token metadata exists in the provided tokensByChain state
 * (which includes both imported tokens and token service data)
 * 2. If not found or incomplete, calls getTokenStandardAndDetails which:
 * - Checks static token lists, token service cache, and user-imported tokens
 * - Falls back to on-chain contract calls (ERC721/ERC1155/ERC20) if needed
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

  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata>(() => {
    // If no token address, return native token metadata
    if (!tokenAddress) {
      return nativeTokenMetadata;
    }

    // Try to get from state first (imported tokens or token list)
    const tokenListForChain = tokensByChain?.[chainId]?.data || {};
    const foundTokenMetadata =
      tokenListForChain[tokenAddress.toLowerCase()] ??
      tokenListForChain[tokenAddress];

    if (foundTokenMetadata) {
      return {
        symbol: foundTokenMetadata.symbol || 'Unknown Token',
        decimals: foundTokenMetadata.decimals ?? 18,
        name: foundTokenMetadata.name || 'Unknown Token',
      };
    }

    // If not found in state, return pending state
    return {
      symbol: 'Unknown Token',
      decimals: null,
      name: 'Unknown Token',
    };
  });

  useEffect(() => {
    let isMounted = true;

    // If no token address, use native token metadata
    if (!tokenAddress) {
      if (isMounted) {
        setTokenMetadata(nativeTokenMetadata);
      }
      return () => {
        isMounted = false;
      };
    }

    // Check if we already have metadata from state
    const tokenListForChain = tokensByChain?.[chainId]?.data || {};
    const foundTokenMetadata =
      tokenListForChain[tokenAddress.toLowerCase()] ??
      tokenListForChain[tokenAddress];

    if (foundTokenMetadata?.decimals !== undefined) {
      // We have complete metadata from state
      const newMetadata = {
        symbol: foundTokenMetadata.symbol || 'Unknown Token',
        decimals: foundTokenMetadata.decimals,
        name: foundTokenMetadata.name || 'Unknown Token',
      };

      if (isMounted) {
        setTokenMetadata((prev) => {
          // Only update if values have actually changed
          if (
            prev.symbol !== newMetadata.symbol ||
            prev.decimals !== newMetadata.decimals ||
            prev.name !== newMetadata.name
          ) {
            return newMetadata;
          }
          return prev;
        });
      }
      return () => {
        isMounted = false;
      };
    }

    // If not in state, fetch from backend (which checks token list API then blockchain)
    const fetchTokenMetadata = async () => {
      try {
        const details = await getTokenStandardAndDetailsByChain(
          tokenAddress,
          selectedAccount?.address,
          undefined,
          chainId,
        );

        if (isMounted && details) {
          const parsedDecimals = details.decimals
            ? parseInt(details.decimals, 10)
            : null;
          const newMetadata = {
            symbol: details.symbol || 'Unknown Token',
            decimals:
              parsedDecimals !== null && !Number.isNaN(parsedDecimals)
                ? parsedDecimals
                : null,
            name: details.name || details.symbol || 'Unknown Token',
          };

          setTokenMetadata((prev) => {
            // Only update if values have actually changed
            if (
              prev.symbol !== newMetadata.symbol ||
              prev.decimals !== newMetadata.decimals ||
              prev.name !== newMetadata.name
            ) {
              return newMetadata;
            }
            return prev;
          });
        }
      } catch (error) {
        log.error('Failed to fetch token metadata', {
          tokenAddress,
          chainId,
          selectedAccountAddress: selectedAccount?.address,
          error: error instanceof Error ? error.message : String(error),
        });
        // Keep the unknown state if fetch fails
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
    nativeTokenMetadata,
    selectedAccount,
  ]);

  return tokenMetadata;
};
