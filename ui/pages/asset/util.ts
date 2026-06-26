import { SUPPORTED_CHAIN_IDS } from '@metamask/assets-controllers';
import { CaipChainId, Hex, assert, isCaipChainId } from '@metamask/utils';
import { Duration } from 'luxon';
import { PriceApiTimePeriod } from './types/PriceApiTimePeriod';

/**
 * Firefox and Chrome process the asset params differently due to how they handle decoding fragments.
 * E.g. With a route of `/asset/solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/solana%3A5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp%2Ftoken%3AXXX`
 * (where the solana%3A5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp%2Ftoken%3AXXX is an encoded version of the asset id)
 *
 * - Chrome will decode the above path as `{chainId}/{asset}`
 * - Chrome will decode the `asset` param as solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:XXX
 * - Chrome will therefore leave the `id` param as undefined.
 *
 * - Firefox will decode the above path as `{chainId}/{asset}/{id}`
 * - Firefox will decode the `asset` param as solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp
 * - Firefox will therefore leave the `id` param as token:XXX
 *
 * @param params - route params
 * @param params.chainId
 * @param params.asset
 * @param params.id
 * @returns
 */
export const processAssetParams = (
  params: Partial<{ chainId: Hex | CaipChainId; asset: string; id: string }>,
) => {
  const { chainId, asset, id } = params;
  const isCaipChain = chainId ? isCaipChainId(chainId) : false;
  const rawAsset = isCaipChain && asset && id ? `${asset}/${id}` : asset;
  const decodedAsset = rawAsset ? decodeURIComponent(rawAsset) : undefined;
  return { chainId, asset, id, decodedAsset };
};

/** Formats a datetime in a short human readable format like 'Feb 8, 12:11 PM' */
export const getShortDateFormatter = () =>
  Intl.DateTimeFormat(navigator.language, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

/** Formats a datetime in a short human readable format like 'Feb 8, 2030' */
export const getShortDateFormatterV2 = () =>
  Intl.DateTimeFormat(navigator.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

/**
 * Returns a dynamically formatted date string.
 * If the date is in the same year as the current date, it omits the year.
 * Otherwise, it includes the year.
 *
 * @param date - The date to format, either as a Date object or timestamp.
 * @returns A formatted date string.
 */
export const getDynamicShortDate = (date: Date | number) => {
  const currentDate = new Date(date);
  const now = new Date();
  const isSameYear = currentDate.getFullYear() === now.getFullYear();
  return isSameYear
    ? getShortDateFormatter().format(date)
    : getShortDateFormatterV2().format(date);
};

/**
 * Returns the number of decimals the fiat price should be formatted to.
 * This tells `currency-formatter` to render prices < 1 cent like $0.00001234
 *
 * @param price - The fiat price to determine formatting precision.
 */
export const getPricePrecision = (price: number) => {
  if (price === 0) {
    return 1;
  }
  let precision = 2;
  for (let p = Math.abs(price); p < 1; precision++) {
    p *= 10;
  }
  return precision;
};

/**
 * Returns true if the price api supports the chain id.
 *
 * @param chainId - The hexadecimal chain id.
 */
export const chainSupportsPricing = (chainId: Hex) =>
  (SUPPORTED_CHAIN_IDS as readonly string[]).includes(chainId);

/** The opacity components should set during transition */
export const loadingOpacity = 0.2;

export const finiteFallback = <TFallback>(
  value: number,
  fallback: TFallback,
): number | TFallback => (Number.isFinite(value) ? value : fallback);

export const findAssetByAddress = <TItem extends { address: string }>(
  data: Record<string, TItem[]>,
  address?: string,
  chainId?: string,
): TItem | undefined | null => {
  if (!chainId) {
    console.error('Chain ID is required.');
    return null;
  }

  const tokens = data[chainId];

  if (!tokens) {
    console.warn(`No tokens found for chainId: ${chainId}`);
    return null;
  }

  if (!address) {
    return tokens.find((token) => !token.address);
  }

  return tokens.find(
    (token) =>
      token.address && token.address.toLowerCase() === address.toLowerCase(),
  );
};

/**
 * Maps an ISO 8601 duration string to a Price API time period string.
 *
 * @param duration - The ISO 8601 duration string, e.g. "P1D", "P1M", "P1Y", "P3YT45S", ...
 * @returns The corresponding Price API time period string.
 */
export const fromIso8601DurationToPriceApiTimePeriod = (
  duration: string,
): PriceApiTimePeriod => {
  assert(
    Duration.fromISO(duration, { locale: 'en' }).isValid,
    `Invalid ISO 8601 duration: ${duration}`,
  );

  const SUPPORTED_MAPPINGS: Record<string, PriceApiTimePeriod> = {
    P1D: '1D',
    P7D: '7D',
    P1W: '7D',
    P1M: '1M',
    P3M: '3M',
    P1Y: '1Y',
    P1000Y: '1000Y',
  };

  const timePeriod = SUPPORTED_MAPPINGS[duration];

  if (!timePeriod) {
    throw new Error(
      `No Price API timePeriod matching the ISO 8601 duration: ${duration}`,
    );
  }

  return timePeriod;
};
