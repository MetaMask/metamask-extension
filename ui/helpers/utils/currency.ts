import BN from 'bn.js';
import { BigNumber } from 'bignumber.js';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { Numeric } from '../../../shared/modules/Numeric';

/**
 * Determines if the provided chainId is a default MetaMask chain
 *
 * @param chainId - chainId to check
 * @returns True if the chainId is a default MetaMask chain
 */
export function isDefaultMetaMaskChain(chainId?: string): boolean {
  if (
    !chainId ||
    chainId === CHAIN_IDS.MAINNET ||
    chainId === CHAIN_IDS.LINEA_MAINNET ||
    chainId === CHAIN_IDS.GOERLI ||
    chainId === CHAIN_IDS.SEPOLIA ||
    chainId === CHAIN_IDS.LINEA_GOERLI ||
    chainId === CHAIN_IDS.LINEA_SEPOLIA ||
    chainId === CHAIN_IDS.LOCALHOST
  ) {
    return true;
  }

  return false;
}

/**
 * Converts wei hex value to a BN object
 *
 * @param balance - Hex string representing wei amount
 * @returns BN object of the balance
 */
export function numericBalance(balance?: string): BN {
  if (!balance) {
    return new BN(0, 16);
  }
  const stripped = stripHexPrefix(balance);
  return new BN(stripped, 16);
}

/**
 * Strips the hex prefix from a string
 *
 * @param hex - Hex string to strip prefix from
 * @returns Hex string without prefix
 */
function stripHexPrefix(hex?: string): string {
  if (!hex || typeof hex !== 'string') {
    return '';
  }
  return hex.startsWith('0x') ? hex.slice(2) : hex;
}

/**
 * Parses a hex balance value into its decimal parts
 *
 * @param balance - Hex string representing wei amount
 * @returns Array with [beforeDecimal, afterDecimal] parts
 */
export function parseBalance(balance?: string): [string, string] {
  let afterDecimal;
  const wei = numericBalance(balance);
  const weiString = wei.toString();
  const trailingZeros = /0+$/u;

  const beforeDecimal =
    weiString.length > 18 ? weiString.slice(0, weiString.length - 18) : '0';
  afterDecimal = `000000000000000000${wei}`
    .slice(-18)
    .replace(trailingZeros, '');
  if (afterDecimal === '') {
    afterDecimal = '0';
  }
  return [beforeDecimal, afterDecimal];
}

/**
 * Formats a balance for display with specific decimal precision
 *
 * @param balance - Hex or decimal amount to format
 * @param decimalsToKeep - Number of decimals to show
 * @param needsParse - Whether the balance needs to be parsed (true for hex input)
 * @param ticker - Symbol to show after the number (e.g. 'ETH')
 * @returns Formatted balance string
 */
export function formatBalance(
  balance?: string | string[],
  decimalsToKeep?: number,
  needsParse = true,
  ticker = 'ETH',
): string {
  const parsed = needsParse
    ? parseBalance(balance as string)
    : (balance as string).split('.');
  const beforeDecimal = parsed[0];
  let afterDecimal = parsed[1];
  let formatted = 'None';

  if (decimalsToKeep === undefined) {
    if (beforeDecimal === '0') {
      if (afterDecimal !== '0') {
        const sigFigs = afterDecimal.match(/^0*(.{2})/u); // default: grabs 2 most significant digits
        if (sigFigs) {
          afterDecimal = sigFigs[0];
        }
        formatted = `0.${afterDecimal} ${ticker}`;
      }
    } else {
      formatted = `${beforeDecimal}.${afterDecimal.slice(0, 3)} ${ticker}`;
    }
  } else {
    afterDecimal += Array(decimalsToKeep).join('0');
    formatted = `${beforeDecimal}.${afterDecimal.slice(
      0,
      decimalsToKeep,
    )} ${ticker}`;
  }
  return formatted;
}

/**
 * Comparison function for BN greater than
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns true if a > b, false otherwise, null if invalid inputs
 */
export function bnGreaterThan(
  a?: string | number | null,
  b?: string | number | null,
): boolean | null {
  if (a === null || a === undefined || b === null || b === undefined) {
    return null;
  }
  return new BigNumber(a, 10).gt(b, 10);
}

/**
 * Comparison function for BN less than
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns true if a < b, false otherwise, null if invalid inputs
 */
export function bnLessThan(
  a?: string | number | null,
  b?: string | number | null,
): boolean | null {
  if (a === null || a === undefined || b === null || b === undefined) {
    return null;
  }
  return new BigNumber(a, 10).lt(b, 10);
}

/**
 * Comparison function for BN greater than or equal to
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns true if a >= b, false otherwise, null if invalid inputs
 */
export function bnGreaterThanEqualTo(
  a?: string | number | null,
  b?: string | number | null,
): boolean | null {
  if (a === null || a === undefined || b === null || b === undefined) {
    return null;
  }
  return new BigNumber(a, 10).gte(b, 10);
}

/**
 * Comparison function for BN less than or equal to
 *
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns true if a <= b, false otherwise, null if invalid inputs
 */
export function bnLessThanEqualTo(
  a?: string | number | null,
  b?: string | number | null,
): boolean | null {
  if (a === null || a === undefined || b === null || b === undefined) {
    return null;
  }
  return new BigNumber(a, 10).lte(b, 10);
}

/**
 * Rounds a number to specified decimal places and removes trailing zeroes
 *
 * @param numberish - Value to round
 * @param numberOfDecimalPlaces - Number of decimal places to keep
 * @returns Rounded number
 */
export function roundToDecimalPlacesRemovingExtraZeroes(
  numberish?: number | string | null,
  numberOfDecimalPlaces = 0,
): string | number {
  if (numberish === undefined || numberish === null) {
    return '';
  }
  return new Numeric(
    new Numeric(numberish, 10).toFixed(numberOfDecimalPlaces),
    10,
  ).toNumber();
}

/**
 * Formats timing in seconds to a human-readable format
 *
 * @param t - Translation function
 * @param milliseconds - Time in milliseconds
 * @returns Formatted time string
 */
export const toHumanReadableTime = (
  t: (key: string, values?: unknown[]) => string,
  milliseconds?: number | null,
): string => {
  if (milliseconds === undefined || milliseconds === null) {
    return '';
  }
  const seconds = Math.ceil(milliseconds / 1000);
  const MINUTE_CUTOFF = 90 * 60;
  const SECOND_CUTOFF = 90;

  if (seconds <= SECOND_CUTOFF) {
    return t('gasTimingSecondsShort', [seconds]);
  }
  if (seconds <= MINUTE_CUTOFF) {
    return t('gasTimingMinutesShort', [Math.ceil(seconds / 60)]);
  }
  return t('gasTimingHoursShort', [Math.ceil(seconds / 3600)]);
};
