import { Hex } from '@metamask/utils';
import { CHAIN_ID_TO_CURRENCY_SYMBOL_MAP } from '../constants/network';
import { fetchAssetMetadata } from './asset-utils';

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

export type GatorPermissionRule = {
  type: string;
  isAdjustmentAllowed: boolean;
  data: Record<string, any>;
};

// Shared promise cache to dedupe and reuse token info fetches per chainId:address
const gatorTokenInfoPromiseCache = new Map<string, Promise<GatorTokenInfo>>();

/**
 * An enum representing the time periods for which the stream rate can be calculated.
 */
export enum TimePeriod {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
}

/**
 * A mapping of time periods to their equivalent seconds.
 */
export const TIME_PERIOD_TO_SECONDS: Record<TimePeriod, bigint> = {
  [TimePeriod.DAILY]: 60n * 60n * 24n, // 86,400(seconds)
  [TimePeriod.WEEKLY]: 60n * 60n * 24n * 7n, // 604,800(seconds)
  // Monthly is difficult because months are not consistent in length.
  // We approximate by calculating the number of seconds in 1/12th of a year.
  [TimePeriod.MONTHLY]: (60n * 60n * 24n * 365n) / 12n, // 2,629,760(seconds)
};

/**
 * Generates a human-readable description for a period duration in seconds.
 *
 * @param periodDuration - The period duration in seconds (can be string or number)
 * @param t - Translation function for internationalization
 * @returns A human-readable frequency description
 */
export function formatPeriodFrequency(periodDuration: string | number): string {
  const duration = BigInt(periodDuration);

  // Check for standard time periods
  if (duration === TIME_PERIOD_TO_SECONDS[TimePeriod.DAILY]) {
    return 'daily';
  }
  if (duration === TIME_PERIOD_TO_SECONDS[TimePeriod.WEEKLY]) {
    return 'weekly';
  }
  if (duration === TIME_PERIOD_TO_SECONDS[TimePeriod.MONTHLY]) {
    return 'monthly';
  }
  return '';
}

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
 * @param params.tokenAddress
 * @param params.allowExternalServices
 * @param params.getTokenStandardAndDetailsByChain
 */
export async function getGatorPermissionTokenInfo(params: {
  permissionType: string;
  chainId: string;
  networkConfig?: { nativeCurrency?: string; name?: string } | null;
  tokenAddress?: string;
  allowExternalServices: boolean;
  getTokenStandardAndDetailsByChain?: GetTokenStandardAndDetailsByChain;
}): Promise<GatorTokenInfo> {
  const {
    permissionType,
    chainId,
    networkConfig,
    tokenAddress,
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
 * Formats a token value to a human-readable string.
 * @param args - The arguments to format.
 * @param args.value - The token value in wei as a hex string.
 * @param args.decimals - The number of decimal places the token uses.
 * @returns The formatted human-readable token value.
 */
export const formatUnitsFromHex = ({
  value,
  decimals,
}: {
  value: Hex;
  decimals: number;
}): string => {
  if (!value) {
    return '0';
  }
  const valueBigInt = BigInt(value);
  const valueString = valueBigInt.toString().padStart(decimals + 1, '0');

  const decimalPart = valueString.slice(0, -decimals);
  const fractionalPart = valueString.slice(-decimals);
  const trimmedFractionalPart = fractionalPart.replace(/0+$/u, '');

  if (trimmedFractionalPart.length > 0) {
    return `${decimalPart}.${trimmedFractionalPart}`;
  }
  return decimalPart;
};

/**
 * Converts a unix timestamp(in seconds) to a human-readable date format.
 *
 * @param timestamp - The unix timestamp in seconds.
 * @returns The formatted date string in mm/dd/yyyy format.
 */
export const convertTimestampToReadableDate = (timestamp: number) => {
  if (timestamp === 0) {
    return '';
  }
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds

  if (isNaN(date.getTime())) {
    return '';
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
};

/**
 * Extracts the expiry timestamp from the rules.
 *
 * @param rules - The rules to extract the expiry from.
 * @returns The expiry timestamp.
 */
export const extractExpiry = (rules: GatorPermissionRule[]): number => {
  if (!rules) {
    return 0;
  }
  const expiry = rules.find((rule) => rule.type === 'expiry');
  if (!expiry) {
    return 0;
  }
  return expiry.data.timestamp;
};
