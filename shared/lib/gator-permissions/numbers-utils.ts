import { Hex } from '@metamask/utils';
import { Numeric } from '../../modules/Numeric';

/**
 * Minimum displayable token amount.
 * Values below this threshold are shown as "<0.00001"
 */
export const MINIMUM_DISPLAYABLE_TOKEN_AMOUNT = 0.00001;

/**
 * Default number formatting options for token amounts.
 */
export const DEFAULT_TOKEN_AMOUNT_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 5,
};

/**
 * Converts a hex value to a decimal value
 *
 * @param value - The hex value to convert
 * @param decimals - The number of decimals to shift the value by (undefined if decimals could not be resolved)
 * @returns The decimal value, or raw units if decimals is undefined
 */
export function getDecimalizedHexValue(
  value: Hex,
  decimals: number | undefined,
): string {
  if (decimals === undefined) {
    // Return raw units when decimals cannot be resolved
    return new Numeric(value, 16).toBase(10).toString();
  }
  return new Numeric(value, 16).toBase(10).shiftedBy(decimals).toString();
}
