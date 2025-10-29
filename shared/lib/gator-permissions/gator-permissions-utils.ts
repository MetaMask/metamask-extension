import { Hex } from '@metamask/utils';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../../constants/network';
import { fetchAssetMetadata } from '../asset-utils';
import {
  getPeriodFrequencyValueTranslationKey,
} from './time-utils';

// Token info type used across helpers
export type GatorTokenInfo = { symbol: string; decimals: number };

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

// Type for translation function
export type TranslationFunction = (key: string, ...args: unknown[]) => string;

// Types for permission data
export type GatorPermissionData = {
  tokenAddress?: string;
  amountPerSecond?: string;
  periodDuration?: string;
  periodAmount?: string;
  [key: string]: unknown;
};

// Shared promise cache to dedupe and reuse token info fetches per chainId:address
const gatorTokenInfoPromiseCache = new Map<string, Promise<GatorTokenInfo>>();

/**
 * Fetch ERC-20 token info (symbol as name, decimals) without caching.
 *
 * Behavior:
 * - If external services are enabled, attempts the MetaMask token metadata API first.
 * - If missing data or disabled, falls back to background on-chain details by chain.
 * - Returns a best-effort `{ name, decimals }` (defaults: name='Unknown Token', decimals=18).
 *
 * @param address
 * @param chainId
 * @param allowExternalServices
 * @param getTokenStandardAndDetailsByChain
 */
export async function fetchGatorErc20TokenInfo(
  address: string,
  chainId: Hex,
  allowExternalServices: boolean,
  getTokenStandardAndDetailsByChain?: GetTokenStandardAndDetailsByChain,
): Promise<GatorTokenInfo> {
  let symbol: string | undefined;
  let decimals: number | undefined;

  if (allowExternalServices) {
    const metadata = await fetchAssetMetadata(address, chainId);
    symbol = metadata?.symbol;
    decimals = metadata?.decimals;
  }

  if (!symbol || decimals === null || decimals === undefined) {
    if (getTokenStandardAndDetailsByChain) {
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
          const parsed10 = parseInt(decRaw, 10);
          if (Number.isFinite(parsed10)) {
            decimals = parsed10;
          } else {
            const parsed16 = parseInt(decRaw, 16);
            if (Number.isFinite(parsed16)) {
              decimals = parsed16;
            }
          }
        }
        symbol = details?.symbol ?? symbol;
      } catch (_e) {
        // ignore and keep fallbacks
      }
    }
  }

  return {
    symbol: symbol || 'Unknown Token',
    decimals: decimals ?? 18,
  } as const;
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
 * @param address
 * @param chainId
 * @param allowExternalServices
 * @param getTokenStandardAndDetailsByChain
 */
export async function getGatorErc20TokenInfo(
  address: string,
  chainId: Hex,
  allowExternalServices: boolean,
  getTokenStandardAndDetailsByChain?: GetTokenStandardAndDetailsByChain,
): Promise<GatorTokenInfo> {
  const key = `${chainId}:${address.toLowerCase()}`;
  const existing = gatorTokenInfoPromiseCache.get(key);
  if (existing) {
    return existing;
  }
  const promise = fetchGatorErc20TokenInfo(
    address,
    chainId,
    allowExternalServices,
    getTokenStandardAndDetailsByChain,
  );
  gatorTokenInfoPromiseCache.set(key, promise);
  return promise;
}

/**
 * Resolve token display info (name/symbol, decimals) for a Gator permission.
 *
 * - If `permissionType` includes 'native-token', returns network native symbol and 18 decimals.
 * - Otherwise, fetches ERC-20 info (cached) using `tokenAddress` from `permissionData`.
 *
 * @param params
 * @param params.permissionType
 * @param params.chainId
 * @param params.networkConfig
 * @param params.permissionData
 * @param params.allowExternalServices
 * @param params.getTokenStandardAndDetailsByChain
 */
export async function getGatorPermissionTokenInfo(params: {
  permissionType: string;
  chainId: string;
  networkConfig?: { nativeCurrency?: string; name?: string } | null;
  permissionData?: GatorPermissionData;
  allowExternalServices: boolean;
  getTokenStandardAndDetailsByChain?: GetTokenStandardAndDetailsByChain;
}): Promise<GatorTokenInfo> {
  const {
    permissionType,
    chainId,
    networkConfig,
    permissionData,
    allowExternalServices,
    getTokenStandardAndDetailsByChain,
  } = params;
  const isNative = permissionType.includes('native-token');
  if (isNative) {
    const nativeSymbol =
      networkConfig?.nativeCurrency ||
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
        chainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
      ] ||
      'ETH';
    return { symbol: nativeSymbol, decimals: 18 };
  }

  const tokenAddress = permissionData?.tokenAddress;
  if (!tokenAddress) {
    return { symbol: 'Unknown Token', decimals: 18 };
  }
  return await getGatorErc20TokenInfo(
    tokenAddress,
    chainId as Hex,
    allowExternalServices,
    getTokenStandardAndDetailsByChain,
  );
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
    threshold = 0.00001,
    numberFormatOptions = {
      minimumFractionDigits: 0,
      maximumFractionDigits: 5,
    },
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
  } catch (_err) {
    return 'Permission details unavailable';
  }
}

/**
 * Derive display metadata from a gator permission type and data.
 *
 * @param permissionType - The type of permission
 * @param permissionDataParam - The permission data containing amount and frequency information
 * @param t - Translation function for internationalization
 * @returns Object containing display name, amount, and frequency
 */
export function getGatorPermissionDisplayMetadata(
  permissionType: string,
  permissionDataParam: GatorPermissionData,
  t: TranslationFunction,
): { displayName: string; amount: string; frequency: string } {
  if (
    permissionType === 'native-token-stream' ||
    permissionType === 'erc20-token-stream'
  ) {
    return {
      displayName: t('tokenStream'),
      amount: permissionDataParam.amountPerSecond as string,
      frequency: t('perSecond'),
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
      displayName: t('tokenSubscription'),
      amount: permissionDataParam.periodAmount as string,
      frequency: t(getPeriodFrequencyValueTranslationKey(periodDuration)),
    };
  }

  return {
    displayName: 'Permission',
    amount: '',
    frequency: '',
  };
}
