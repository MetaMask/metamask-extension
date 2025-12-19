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
 * @param decimals - The number of decimals to shift the value by
 * @returns The decimal value
 */
export function getDecimalizedHexValue(value: Hex, decimals: number): string {
  return new Numeric(value, 16).toBase(10).shiftedBy(decimals).toString();
}
