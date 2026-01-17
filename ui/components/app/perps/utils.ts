import { TextColor } from '@metamask/design-system-react';
import type { Order, PerpsMarketData } from './types';
import { HYPERLIQUID_ASSET_ICONS_BASE_URL } from './constants';
import { mockCryptoMarkets, mockHip3Markets } from './mocks';

/**
 * Extract display name from symbol (strips DEX prefix for HIP-3 markets)
 * e.g., "xyz:TSLA" -> "TSLA", "BTC" -> "BTC"
 *
 * @param symbol - The symbol to extract the display name from
 * @returns The display name
 * @example
 * getDisplayName('xyz:TSLA') => 'TSLA'
 * getDisplayName('BTC') => 'BTC'
 */
export const getDisplayName = (symbol: string): string => {
  const colonIndex = symbol.indexOf(':');
  if (colonIndex > 0 && colonIndex < symbol.length - 1) {
    return symbol.substring(colonIndex + 1);
  }
  return symbol;
};

/**
 * Determines if a position is long (positive size) or short (negative size)
 *
 * @param size - The position size as a string
 * @returns 'long' or 'short'
 * @example
 * getPositionDirection('100') => 'long'
 * getPositionDirection('-50') => 'short'
 */
export const getPositionDirection = (size: string): 'long' | 'short' => {
  return parseFloat(size) >= 0 ? 'long' : 'short';
};

/**
 * Formats the order type for display (capitalizes first letter)
 *
 * @param orderType - The order type to format
 * @returns The formatted order type
 * @example
 * formatOrderType('market') => 'Market'
 * formatOrderType('limit') => 'Limit'
 */
export const formatOrderType = (orderType: Order['orderType']): string => {
  return orderType.charAt(0).toUpperCase() + orderType.slice(1);
};

/**
 * Formats the order status for display (capitalizes first letter)
 *
 * @param status - The order status to format
 * @returns The formatted order status
 * @example
 * formatStatus('open') => 'Open'
 * formatStatus('filled') => 'Filled'
 * formatStatus('canceled') => 'Canceled'
 * formatStatus('rejected') => 'Rejected'
 * formatStatus('queued') => 'Queued'
 * formatStatus('triggered') => 'Triggered'
 */
export const formatStatus = (status: Order['status']): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

/**
 * Get the appropriate text color for order status
 *
 * @param status - The order status to get the color for
 * @returns The appropriate text color
 * @example
 * getStatusColor('open') => TextColor.TextAlternative
 * getStatusColor('filled') => TextColor.SuccessDefault
 * getStatusColor('canceled') => TextColor.ErrorDefault
 * getStatusColor('rejected') => TextColor.ErrorDefault
 * getStatusColor('queued') => TextColor.TextAlternative
 * getStatusColor('triggered') => TextColor.TextAlternative
 */
export const getStatusColor = (status: Order['status']): TextColor => {
  switch (status) {
    case 'filled':
      return TextColor.SuccessDefault;
    case 'canceled':
    case 'rejected':
      return TextColor.ErrorDefault;
    case 'open':
    case 'queued':
    case 'triggered':
    default:
      return TextColor.TextAlternative;
  }
};

/**
 * Get the appropriate text color for a percentage change value
 * Non-negative values (≥ 0) → green, negative → red
 *
 * @param percentString - The percentage string (e.g., "+2.84%", "-1.23%", "0.00%", "2.84%")
 * @returns The appropriate text color
 * @example
 * getChangeColor('+2.84%') => TextColor.SuccessDefault
 * getChangeColor('2.84%') => TextColor.SuccessDefault
 * getChangeColor('0.00%') => TextColor.SuccessDefault
 * getChangeColor('-1.23%') => TextColor.ErrorDefault
 */
export const getChangeColor = (percentString: string): TextColor => {
  const value = parseFloat(percentString.replace('%', ''));
  if (value < 0) {
    return TextColor.ErrorDefault;
  }
  return TextColor.SuccessDefault;
};

/**
 * Extract the display symbol from a full symbol string
 * Strips DEX prefix for HIP-3 markets (e.g., "xyz:TSLA" -> "TSLA")
 * Includes null/type safety checks
 *
 * @param symbol - The symbol to extract the display name from
 * @returns The display name
 * @example
 * getDisplaySymbol('xyz:TSLA') => 'TSLA'
 * getDisplaySymbol('BTC') => 'BTC'
 */
export const getDisplaySymbol = (symbol: string): string => {
  if (!symbol || typeof symbol !== 'string') {
    return symbol;
  }
  const colonIndex = symbol.indexOf(':');
  if (colonIndex > 0 && colonIndex < symbol.length - 1) {
    return symbol.substring(colonIndex + 1);
  }
  return symbol;
};

/**
 * Generate the icon URL for an asset symbol
 * Handles both regular assets and HIP-3 assets (dex:symbol format)
 *
 * @param symbol - The symbol to generate the icon URL for
 * @returns The icon URL
 * @example
 * getAssetIconUrl('BTC') => 'https://app.hyperliquid.xyz/coins/BTC.svg'
 * getAssetIconUrl('xyz:TSLA') => 'https://app.hyperliquid.xyz/coins/xyz:TSLA.svg'
 */
export const getAssetIconUrl = (symbol: string): string => {
  if (!symbol) {
    return '';
  }

  // Check for HIP-3 asset (contains colon)
  if (symbol.includes(':')) {
    const [dex, assetSymbol] = symbol.split(':');
    return `${HYPERLIQUID_ASSET_ICONS_BASE_URL}${dex.toLowerCase()}:${assetSymbol.toUpperCase()}.svg`;
  }

  // Regular asset - uppercase the symbol
  return `${HYPERLIQUID_ASSET_ICONS_BASE_URL}${symbol.toUpperCase()}.svg`;
};

/**
 * Finds market data by symbol from mock data
 * Searches both crypto and HIP-3 markets
 *
 * @param symbol - The market symbol to search for
 * @returns The market data if found, undefined otherwise
 * @example
 * findMarketBySymbol('BTC') => { symbol: 'BTC', name: 'Bitcoin', ... }
 * findMarketBySymbol('xyz:TSLA') => { symbol: 'xyz:TSLA', name: 'Tesla', ... }
 */
export const findMarketBySymbol = (
  symbol: string,
): PerpsMarketData | undefined => {
  const allMarkets = [...mockCryptoMarkets, ...mockHip3Markets];
  return allMarkets.find(
    (market) => market.symbol.toLowerCase() === symbol.toLowerCase(),
  );
};

/**
 * Safely decode a URI component, returning undefined if decoding fails
 * Handles malformed percent-encoding sequences that would throw URIError
 *
 * @param value - The URI-encoded string to decode
 * @returns The decoded string, or undefined if decoding fails
 * @example
 * safeDecodeURIComponent('hello%20world') => 'hello world'
 * safeDecodeURIComponent('%E0%A4%A') => undefined (malformed)
 */
export const safeDecodeURIComponent = (value: string): string | undefined => {
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
};
