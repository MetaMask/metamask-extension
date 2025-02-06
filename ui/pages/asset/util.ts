import { SUPPORTED_CHAIN_IDS, Token } from '@metamask/assets-controllers';
import { Hex } from '@metamask/utils';

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
 * Formats a potentially large number to the nearest unit.
 * e.g. 1T for trillions, 2.3B for billions, 4.56M for millions, 7,890 for thousands, etc.
 *
 * @param t - An I18nContext translator.
 * @param number - The number to format.
 * @returns A localized string of the formatted number + unit.
 */
// eslint-disable-next-line
export const localizeLargeNumber = (t: any, number: number) => {
  if (number >= 1000000000000) {
    return `${(number / 1000000000000).toFixed(2)}${t('trillionAbbreviation')}`;
  } else if (number >= 1000000000) {
    return `${(number / 1000000000).toFixed(2)}${t('billionAbbreviation')}`;
  } else if (number >= 1000000) {
    return `${(number / 1000000).toFixed(2)}${t('millionAbbreviation')}`;
  }
  return number.toFixed(2);
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

export const findAssetByAddress = (
  data: Record<string, Token[]>,
  address?: string,
  chainId?: string,
): Token | undefined | null => {
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
