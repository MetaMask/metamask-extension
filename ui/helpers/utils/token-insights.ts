import {
  isCaipAssetType,
  parseCaipAssetType,
  isStrictHexString,
} from '@metamask/utils';
import { isNativeAddress as isNativeAddressFromBridge } from '@metamask/bridge-controller';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import { TextColor } from '@metamask/design-system-react';

/**
 * Checks if an address represents a native token
 *
 * @param address - The token address to check
 * @returns true if the address is a native token address
 */
export const isNativeAddress = (address: string): boolean => {
  if (!address) {
    return false;
  }

  if (isNativeAddressFromBridge(address)) {
    return true;
  }

  const normalized = address.toLowerCase();
  return [
    '0',
    '0x0',
    '0x',
    '0x0000000000000000000000000000000000000000',
  ].includes(normalized);
};

/**
 * Formats a percentage value for display
 *
 * @param value - The percentage value
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number | undefined): string => {
  if (value === undefined || value === null) {
    return '—';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

/**
 * Formats a currency value in compact notation
 *
 * @param value - The value to format
 * @param currency - The currency code
 * @param locale - The locale for formatting (optional)
 * @returns Formatted currency string
 */
export const formatCompactCurrency = (
  value: number | undefined,
  currency: string,
  locale = 'en-US',
): string => {
  if (!value) {
    return '—';
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 2,
  });

  return formatter.format(value);
};

/**
 * Formats a contract address, handling CAIP format if needed
 *
 * @param address - The address to format
 * @returns Checksummed address for EVM chains, or the original address for non-EVM chains
 */
export const formatContractAddress = (address: string | null): string => {
  if (!address) {
    return '';
  }

  if (isCaipAssetType(address)) {
    const { assetReference } = parseCaipAssetType(address);

    if (isStrictHexString(assetReference)) {
      return toChecksumHexAddress(assetReference);
    }

    return assetReference;
  }

  if (isStrictHexString(address)) {
    return toChecksumHexAddress(address);
  }

  return address;
};

/**
 * Gets the text color based on price change
 *
 * @param change - The price change percentage
 * @returns TextColor enum value
 */
export const getPriceChangeColor = (change: number): TextColor => {
  if (change > 0) {
    return TextColor.SuccessDefault;
  }
  if (change < 0) {
    return TextColor.ErrorDefault;
  }
  return TextColor.TextDefault;
};

/**
 * Determines if contract address should be shown
 *
 * @param address - The token address
 * @returns true if contract address should be displayed
 */
export const shouldShowContractAddress = (address: string | null): boolean => {
  if (!address) {
    return false;
  }
  if (isNativeAddress(address)) {
    return false;
  }

  const normalized = address.toLowerCase();
  return !['0', '0x0', '0x'].includes(normalized);
};
