import {
  type Hex,
  hexToNumber,
  KnownCaipNamespace,
  type CaipChainId,
} from '@metamask/utils';
import log from 'loglevel';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../../constants/network';
import { fetchAssetMetadata } from '../asset-utils';
import { getPeriodFrequencyValueTranslationKey } from './time-utils';
import {
  MINIMUM_DISPLAYABLE_TOKEN_AMOUNT,
  DEFAULT_TOKEN_AMOUNT_FORMAT_OPTIONS,
} from './numbers-utils';

// Token info type used across helpers
export type GatorTokenInfo = {
  symbol: string;
  decimals: number;
  name?: string;
  image?: string;
  address?: string;
  chainId: Hex;
};

// Type for the token details function that can be injected from UI
export type GetTokenStandardAndDetailsByChain = (
  address: string,
  userAddress?: string,
  tokenId?: string,
  chainId?: string,
) => Promise<{
  decimals?: string | number;
  symbol?: string;
  standard?: string;
  [key: string]: unknown;
}>;

// Types for permission data
export type GatorPermissionData = {
  tokenAddress?: string;
  amountPerSecond?: string;
  periodDuration?: string;
  periodAmount?: string;
  [key: string]: unknown;
};

// Types for cache and imported token structures from Redux state
export type CachedTokenData = {
  symbol: string;
  decimals: number;
  name?: string;
  iconUrl?: string;
};

export type CachedTokensByChain = {
  [chainId: string]: {
    data?: {
      [address: string]: CachedTokenData;
    };
  };
};

export type ImportedToken = {
  address?: string;
  symbol: string;
  decimals: number;
  name?: string;
  image?: string;
};

export type ImportedTokensByChain = {
  [chainId: string]: {
    [accountAddress: string]: ImportedToken[];
  };
};

export type NetworkConfiguration = {
  nativeCurrency?: string;
  name?: string;
  chainId?: string;
};

export type NetworkConfigurationsByCaipChainId = {
  [caipChainId: string]: NetworkConfiguration;
};

/**
 * Resolve native token information from network configuration.
 *
 * @param chainId - The chain ID in hex format
 * @param networkConfigurationsByCaipChainId - Network configurations indexed by CAIP chain ID
 * @returns Native token info with symbol and decimals (always returns a value, defaults to ETH with 18 decimals)
 */
export function resolveNativeTokenInfo(
  chainId: Hex,
  networkConfigurationsByCaipChainId?: NetworkConfigurationsByCaipChainId,
): GatorTokenInfo {
  const caipChainId: CaipChainId = `${KnownCaipNamespace.Eip155}:${hexToNumber(chainId)}`;
  const networkConfig = networkConfigurationsByCaipChainId?.[caipChainId];

  const nativeSymbol =
    networkConfig?.nativeCurrency ||
    CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
      chainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
    ] ||
    'ETH';

  return {
    symbol: nativeSymbol,
    decimals: 18,
    chainId,
  };
}

/**
 * Look up token info from cache (tokensChainsCache) or imported tokens.
 * Prioritizes cache over imported tokens.
 *
 * @param tokenAddress - The token contract address
 * @param chainId - The chain ID in hex format
 * @param erc20TokensByChain - Cached tokens from tokensChainsCache
 * @param allTokens - User's imported tokens
 * @returns Token info if found in cache or imported tokens, null otherwise
 */
export function lookupCachedOrImportedTokenInfo(
  tokenAddress: string,
  chainId: Hex,
  erc20TokensByChain?: CachedTokensByChain,
  allTokens?: ImportedTokensByChain,
): GatorTokenInfo | null {
  const normalizedAddress = tokenAddress.toLowerCase();

  // Check tokensChainsCache first (API cache)
  const cachedToken = erc20TokensByChain?.[chainId]?.data?.[normalizedAddress];
  if (cachedToken) {
    return {
      symbol: cachedToken.symbol,
      decimals: cachedToken.decimals,
      name: cachedToken.name,
      image: cachedToken.iconUrl,
      address: tokenAddress,
      chainId,
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
            symbol: foundToken.symbol,
            decimals: foundToken.decimals,
            name: foundToken.name,
            image: foundToken.image,
            address: tokenAddress,
            chainId,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Parse decimals from various formats (number, decimal string, hex string).
 *
 * @param decRaw - The raw decimals value
 * @returns Parsed decimals as a number, or undefined if invalid
 */
function parseDecimals(
  decRaw: string | number | undefined,
): number | undefined {
  if (typeof decRaw === 'number') {
    return decRaw;
  }

  if (typeof decRaw === 'string') {
    const trimmed = decRaw.trim();

    try {
      // Use hexToNumber for hex strings (handles 0x prefix automatically)
      if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
        const parsed = hexToNumber(trimmed as Hex);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
      }

      // Parse as decimal for non-hex strings
      const parsed = parseInt(trimmed, 10);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
    } catch {
      // hexToNumber throws for invalid hex strings
      return undefined;
    }
  }

  return undefined;
}

/**
 * Fetch ERC-20 token info with extended metadata (symbol, decimals, name, image) without caching.
 *
 * Behavior:
 * - If external services are enabled, attempts the MetaMask token metadata API first.
 * - If missing data or disabled, falls back to background on-chain details by chain.
 * - Returns extended info including image from API when available.
 *
 * @param address - Token contract address
 * @param chainId - Chain ID in hex format
 * @param allowExternalServices - Whether to use external API services
 * @param getTokenStandardAndDetailsByChain - Optional function to fetch on-chain token details
 * @returns Extended token info with defaults: symbol='Unknown Token', decimals=18
 */
async function fetchGatorErc20TokenInfo(
  address: string,
  chainId: Hex,
  allowExternalServices: boolean,
  getTokenStandardAndDetailsByChain?: GetTokenStandardAndDetailsByChain,
): Promise<GatorTokenInfo> {
  let symbol: string | undefined;
  let decimals: number | undefined;
  let name: string | undefined;
  let image: string | undefined;
  let onchainError: Error | undefined;

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
  if (!symbol || decimals === undefined) {
    if (getTokenStandardAndDetailsByChain) {
      try {
        const details = await getTokenStandardAndDetailsByChain(
          address,
          undefined,
          undefined,
          chainId,
        );

        decimals =
          parseDecimals(details?.decimals as string | number | undefined) ??
          decimals;
        symbol = details?.symbol ?? symbol;
      } catch (error) {
        onchainError = error as Error;
        log.error('Failed to fetch token details from blockchain', {
          address,
          chainId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  // If both API and on-chain failed, throw the on-chain error
  if ((!symbol || decimals === undefined) && onchainError) {
    throw onchainError;
  }

  return {
    symbol: symbol || 'Unknown Token',
    decimals: decimals ?? 18,
    name,
    image,
    address,
    chainId,
  };
}

// Cache to store the result
const gatorTokenInfoResultCache = new Map<string, Promise<GatorTokenInfo>>();

/**
 * Clear all token info caches. Useful for testing.
 */
export function clearTokenInfoCaches(): void {
  gatorTokenInfoResultCache.clear();
}

/**
 * Fetch ERC-20 token info (symbol as name, decimals) with caching and de-duped in-flight requests.
 *
 * Cache key: `${chainId}:${address.toLowerCase()}`
 * Behavior:
 * - Returns cached value when available.
 * - If a request for the same key is in-flight, returns the same promise.
 * - Otherwise, calls `fetchGatorErc20TokenInfo` and caches the result.
 *
 * @param address - Token contract address
 * @param chainId - Chain ID in hex format
 * @param allowExternalServices - Whether to use external API services
 * @param getTokenStandardAndDetailsByChain - Optional function to fetch on-chain token details
 * @returns Token info with symbol, decimals, name, image, address, and chainId
 */
export async function getGatorErc20TokenInfo(
  address: string,
  chainId: Hex,
  allowExternalServices: boolean,
  getTokenStandardAndDetailsByChain?: GetTokenStandardAndDetailsByChain,
): Promise<GatorTokenInfo> {
  const key = `${chainId}:${address.toLowerCase()}:${allowExternalServices}`;
  const existing = gatorTokenInfoResultCache.get(key);
  if (existing) {
    return existing;
  }
  const promise = fetchGatorErc20TokenInfo(
    address,
    chainId,
    allowExternalServices,
    getTokenStandardAndDetailsByChain,
  ).catch((error) => {
    // Remove from cache on failure to allow retries
    gatorTokenInfoResultCache.delete(key);
    throw error;
  });
  gatorTokenInfoResultCache.set(key, promise);
  return promise;
}

/**
 * Format a human-readable amount description for gator permissions.
 * - Supports hex-encoded and decimal string amounts
 * - Applies a display threshold (e.g. "<0.00001")
 *
 * @param params
 * @param params.amount
 * @param params.tokenSymbol
 * @param params.frequency
 * @param params.tokenDecimals
 * @param params.locale
 * @param params.threshold
 * @param params.numberFormatOptions
 */
export function formatGatorAmountLabel(params: {
  amount: string;
  tokenSymbol: string;
  frequency: string;
  tokenDecimals: number;
  locale: string;
  threshold?: number;
  numberFormatOptions?: Intl.NumberFormatOptions;
}): string {
  const {
    amount,
    tokenSymbol,
    frequency,
    tokenDecimals,
    locale,
    threshold = MINIMUM_DISPLAYABLE_TOKEN_AMOUNT,
    numberFormatOptions = DEFAULT_TOKEN_AMOUNT_FORMAT_OPTIONS,
  } = params;

  if (!amount || amount === '0' || amount === '0x0') {
    return 'Permission details unavailable';
  }

  try {
    let numericAmount: number;

    if (amount.startsWith('0x')) {
      // For hex amounts, we need to convert from wei to token units
      const weiAmount = BigInt(amount);
      const divisor = BigInt(10 ** tokenDecimals);

      // Use BigInt division to avoid precision loss
      const quotient = weiAmount / divisor;
      const remainder = weiAmount % divisor;

      // Convert to number only after BigInt division
      numericAmount = Number(quotient) + Number(remainder) / Number(divisor);
    } else {
      numericAmount = parseFloat(amount);
      if (Number.isNaN(numericAmount)) {
        return 'Permission details unavailable';
      }
    }

    const formatter = new Intl.NumberFormat(locale, numberFormatOptions);
    const formattedAmount =
      numericAmount < threshold
        ? `<${formatter.format(threshold)}`
        : formatter.format(numericAmount);

    return `${formattedAmount} ${tokenSymbol} ${frequency}`;
  } catch (error) {
    return 'Permission details unavailable';
  }
}

/**
 * Derive display metadata from a gator permission type and data.
 * Returns translation keys that should be translated at the UI layer.
 *
 * @param permissionType - The type of permission
 * @param permissionDataParam - The permission data containing amount and frequency information
 * @returns Object containing translation keys for display name and frequency, plus the amount value
 */
export function getGatorPermissionDisplayMetadata(
  permissionType: string,
  permissionDataParam: GatorPermissionData,
): { displayNameKey: string; amount: string; frequencyKey: string } {
  if (
    permissionType === 'native-token-stream' ||
    permissionType === 'erc20-token-stream'
  ) {
    return {
      displayNameKey: 'tokenStream',
      amount: permissionDataParam.amountPerSecond as string,
      frequencyKey: 'perSecond',
    };
  }

  if (
    permissionType === 'native-token-periodic' ||
    permissionType === 'erc20-token-periodic'
  ) {
    const periodDurationStr = permissionDataParam.periodDuration;
    const periodDuration =
      typeof periodDurationStr === 'string'
        ? parseInt(periodDurationStr, 10)
        : 0;
    return {
      displayNameKey: 'tokenSubscription',
      amount: permissionDataParam.periodAmount as string,
      frequencyKey: getPeriodFrequencyValueTranslationKey(periodDuration),
    };
  }

  return {
    displayNameKey: 'permission',
    amount: '',
    frequencyKey: '',
  };
}
