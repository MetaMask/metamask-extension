import { Hex } from '@metamask/utils';
import { Numeric } from '../../modules/Numeric';

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
