import { TextColor } from '@metamask/design-system-react';
import { formatDateWithYearContext } from '../../../helpers/utils/util';
import type {
  Order,
  PerpsMarketData,
  PerpsTransaction,
  PerpsTransactionFilter,
} from './types';
import { HYPERLIQUID_ASSET_ICONS_BASE_URL, PERPS_CONSTANTS } from './constants';

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
 * Normalizes a 24h percentage change string to always include the '%' suffix.
 * The live price stream may omit '%' while market data always includes it.
 *
 * Returns the value unchanged if:
 * - empty / falsy
 * - already contains '%'
 * - contains no digits (e.g. a fallback dash "—" or error string)
 *
 * @param value - Raw percentage string, with or without '%' (e.g., "+2.84" or "+2.84%")
 * @returns The normalized percentage string with '%' appended if missing
 * @example
 * formatChangePercent('+2.84')  => '+2.84%'
 * formatChangePercent('+2.84%') => '+2.84%'
 * formatChangePercent('')       => ''
 * formatChangePercent('—')      => '—'
 */
export const formatChangePercent = (value: string): string => {
  if (!value || value.includes('%') || !/\d/u.test(value)) {
    return value;
  }
  return `${value}%`;
};

/**
 * Normalizes a 24h percentage change string for UI display.
 * Positive numeric values are always shown with an explicit '+' prefix,
 * matching mobile behavior. Negative values and zero keep their natural sign.
 *
 * Returns the value unchanged if:
 * - empty / falsy
 * - contains no digits (e.g. a fallback dash "—" or error string)
 *
 * @param value - Raw percentage string, with or without '%' or '+' (e.g., "2.84", "+2.84%", "-1.23%")
 * @returns The normalized percentage string for display
 * @example
 * formatSignedChangePercent('2.84') => '+2.84%'
 * formatSignedChangePercent('2.84%') => '+2.84%'
 * formatSignedChangePercent('+2.84%') => '+2.84%'
 * formatSignedChangePercent('-1.23%') => '-1.23%'
 * formatSignedChangePercent('0.00%') => '0.00%'
 */
export const formatSignedChangePercent = (value: string): string => {
  const formattedValue = formatChangePercent(value);

  if (!formattedValue || !/\d/u.test(formattedValue)) {
    return formattedValue;
  }

  if (
    formattedValue.startsWith('+') ||
    formattedValue.startsWith('-') ||
    Number.parseFloat(formattedValue.replace('%', '')) <= 0
  ) {
    return formattedValue;
  }

  return `+${formattedValue}`;
};

/**
 * Get the appropriate text color for a percentage change value
 * Non-negative values (≥ 0) → green, negative → red,
 * non-numeric / fallback values → alternative text color
 *
 * @param percentString - The percentage string (e.g., "+2.84%", "-1.23%", "0.00%", "2.84%")
 * @returns The appropriate text color
 * @example
 * getChangeColor('+2.84%') => TextColor.SuccessDefault
 * getChangeColor('2.84%') => TextColor.SuccessDefault
 * getChangeColor('0.00%') => TextColor.SuccessDefault
 * getChangeColor('-1.23%') => TextColor.ErrorDefault
 * getChangeColor('N/A') => TextColor.TextAlternative
 */
export const getChangeColor = (percentString: string): TextColor => {
  const value = Number.parseFloat(percentString.replace('%', ''));
  if (Number.isNaN(value)) {
    return TextColor.TextAlternative;
  }
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

type TpslPriceInput = {
  takeProfitPrice?: string | null;
  stopLossPrice?: string | null;
};

type TpslPriceOutput = {
  takeProfitPrice?: string;
  stopLossPrice?: string;
};

const normalizePriceInput = (value?: string | null): string | undefined => {
  const cleanedValue = value?.replaceAll(',', '').trim() ?? '';
  return cleanedValue === '' ? undefined : cleanedValue;
};

/**
 * Normalizes TP/SL input strings by removing formatting and mapping empty values to undefined.
 *
 * @param prices - The raw TP/SL input strings.
 * @returns The normalized TP/SL values ready for controller calls.
 */
export const normalizeTpslPrices = (
  prices: TpslPriceInput,
): TpslPriceOutput => {
  return {
    takeProfitPrice: normalizePriceInput(prices.takeProfitPrice),
    stopLossPrice: normalizePriceInput(prices.stopLossPrice),
  };
};

// Transaction history utility types
type GroupedTransactions = {
  date: string;
  transactions: PerpsTransaction[];
};

/**
 * Groups transactions by date for display in the activity list
 *
 * @param transactions - Array of transactions to group
 * @param t - Translation function for date labels
 * @returns Array of grouped transactions with date labels
 * @example
 * groupTransactionsByDate(transactions, t) => [
 *   { date: 'Today', transactions: [...] },
 *   { date: 'Yesterday', transactions: [...] },
 *   { date: 'Jan 15', transactions: [...] }
 * ]
 */
export const groupTransactionsByDate = (
  transactions: PerpsTransaction[],
  t: (key: string) => string,
): GroupedTransactions[] => {
  const groups = new Map<string, PerpsTransaction[]>();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Sort transactions by timestamp (newest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => b.timestamp - a.timestamp,
  );

  for (const transaction of sortedTransactions) {
    const txDate = new Date(transaction.timestamp);
    const txDay = new Date(
      txDate.getFullYear(),
      txDate.getMonth(),
      txDate.getDate(),
    );

    let dateLabel: string;
    if (txDay.getTime() === today.getTime()) {
      dateLabel = t('perpsDateToday');
    } else if (txDay.getTime() === yesterday.getTime()) {
      dateLabel = t('perpsDateYesterday');
    } else {
      dateLabel = formatDateWithYearContext(transaction.timestamp);
    }

    const existing = groups.get(dateLabel) || [];
    existing.push(transaction);
    groups.set(dateLabel, existing);
  }

  return Array.from(groups.entries()).map(([date, txs]) => ({
    date,
    transactions: txs,
  }));
};

/**
 * Filters transactions by type
 *
 * @param transactions - Array of transactions to filter
 * @param filter - The filter type to apply
 * @returns Filtered array of transactions
 * @example
 * filterTransactionsByType(transactions, 'trade') => [... only trade transactions]
 * filterTransactionsByType(transactions, 'deposit') => [... deposits and withdrawals]
 */
export const filterTransactionsByType = (
  transactions: PerpsTransaction[],
  filter: PerpsTransactionFilter,
): PerpsTransaction[] => {
  if (filter === 'deposit') {
    // Include both deposits and withdrawals
    return transactions.filter(
      (tx) => tx.type === 'deposit' || tx.type === 'withdrawal',
    );
  }

  return transactions.filter((tx) => tx.type === filter);
};

/**
 * Transaction status type for deposit/withdrawal operations.
 */
type TransactionStatus =
  | 'confirmed'
  | 'pending'
  | 'failed'
  | 'completed'
  | 'bridging';

/**
 * Get the appropriate text color for transaction status.
 *
 * @param status - The transaction status
 * @returns The appropriate text color
 */
export const getTransactionStatusColor = (
  status: TransactionStatus,
): TextColor => {
  switch (status) {
    case 'confirmed':
    case 'completed':
      return TextColor.SuccessDefault;
    case 'pending':
    case 'bridging':
      return TextColor.WarningDefault;
    case 'failed':
      return TextColor.ErrorDefault;
    default:
      return TextColor.TextAlternative;
  }
};

/**
 * Get the appropriate text color for transaction amount
 * Positive amounts (received/profit) → green, negative (paid/loss) → red
 *
 * @param amount - The amount string (may include +/- prefix)
 * @returns The appropriate text color
 */
export const getTransactionAmountColor = (amount: string): TextColor => {
  // Check for explicit negative sign or "paid" in context
  if (amount.startsWith('-')) {
    return TextColor.ErrorDefault;
  }
  if (amount.startsWith('+')) {
    return TextColor.SuccessDefault;
  }
  // Default to neutral
  return TextColor.TextDefault;
};

/**
 * Filter markets by search query
 * Searches through both symbol and name fields (case-insensitive)
 *
 * @param markets - Array of markets to filter
 * @param searchQuery - Search query string
 * @returns Filtered array of markets matching the query
 * @example
 * filterMarketsByQuery([{ symbol: 'BTC', name: 'Bitcoin' }], 'btc') // → [{ symbol: 'BTC', name: 'Bitcoin' }]
 * filterMarketsByQuery([{ symbol: 'BTC', name: 'Bitcoin' }], 'coin') // → [{ symbol: 'BTC', name: 'Bitcoin' }]
 * filterMarketsByQuery([{ symbol: 'BTC', name: 'Bitcoin' }], '') // → [{ symbol: 'BTC', name: 'Bitcoin' }]
 */
export const filterMarketsByQuery = (
  markets: PerpsMarketData[],
  searchQuery: string,
): PerpsMarketData[] => {
  // Return all markets if query is empty
  if (!searchQuery?.trim()) {
    return markets;
  }

  const lowerQuery = searchQuery.toLowerCase().trim();

  return markets.filter(
    (market) =>
      market.symbol?.toLowerCase().includes(lowerQuery) ||
      market.name?.toLowerCase().includes(lowerQuery),
  );
};

/**
 * Check if a market is an allowed HIP-3 market (stocks, commodities, forex)
 *
 * HIP-3 markets are identified by having a marketSource that matches one of
 * the allowed HIP-3 DEX providers from the feature flag.
 *
 * @param market - The market data to check
 * @param allowedSources - Set of allowed HIP-3 source identifiers from the selector
 * @returns True if the market is from an allowed HIP-3 source
 * @example
 * const allowedSources = new Set(['xyz']);
 * isHip3Market({ symbol: 'xyz:TSLA', marketSource: 'xyz' }, allowedSources) // → true
 * isHip3Market({ symbol: 'BTC', marketSource: undefined }, allowedSources) // → false
 * isHip3Market({ symbol: 'abc:AAPL', marketSource: 'abc' }, allowedSources) // → false
 */
export const isHip3Market = (
  market: PerpsMarketData,
  allowedSources: Set<string>,
): boolean => {
  return Boolean(
    market.marketSource && allowedSources.has(market.marketSource),
  );
};

/**
 * Check if a market is a crypto market (main DEX, no marketSource)
 *
 * @param market - The market data to check
 * @returns True if the market is a crypto market
 * @example
 * isCryptoMarket({ symbol: 'BTC', marketSource: undefined }) // → true
 * isCryptoMarket({ symbol: 'xyz:TSLA', marketSource: 'xyz' }) // → false
 */
export const isCryptoMarket = (market: PerpsMarketData): boolean => {
  return !market.marketSource;
};

export function getPnlDisplayColor(pnl: number): TextColor {
  if (pnl > 0) {
    return TextColor.SuccessDefault;
  }
  if (pnl < 0) {
    return TextColor.ErrorDefault;
  }
  return TextColor.TextDefault;
}

/**
 * Format a RoE% value for display in TP/SL inputs.
 * Always returns the absolute value: integers with no decimal ("25"),
 * non-integers with 2 decimal places ("25.50").
 *
 * @param value - The numeric percentage value to format
 * @returns The formatted percentage string
 * @example
 * formatRoePercent(10) => '10'
 * formatRoePercent(-25.5) => '25.50'
 * formatRoePercent(0) => '0'
 */
export const formatRoePercent = (value: number): string => {
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(2);
};

const volumeMultipliers: Record<string, number> = {
  K: 1e3,
  M: 1e6,
  B: 1e9,
  T: 1e12,
} as const;

const VOLUME_SUFFIX_REGEX = /\$?([\d.,]+)([KMBT])?/u;

const removeCommas = (str: string): string => {
  let result = '';
  for (const char of str) {
    if (char !== ',') {
      result += char;
    }
  }
  return result;
};

/**
 * Parse volume strings with magnitude suffixes (e.g., '$1.2B', '$850M')
 * Returns numeric value for sorting
 *
 * @param volumeStr - The volume string to parse
 * @returns Numeric value for sorting
 */
export const parseVolume = (volumeStr: string | undefined): number => {
  if (!volumeStr) {
    return -1;
  }

  if (volumeStr === PERPS_CONSTANTS.FALLBACK_PRICE_DISPLAY) {
    return -1;
  }
  if (volumeStr === '$<1') {
    return 0.5;
  }

  const suffixMatch = VOLUME_SUFFIX_REGEX.exec(volumeStr);
  if (suffixMatch) {
    const [, numberPart, suffix] = suffixMatch;
    const baseValue = Number.parseFloat(removeCommas(numberPart));

    if (Number.isNaN(baseValue)) {
      return -1;
    }

    return suffix ? baseValue * volumeMultipliers[suffix] : baseValue;
  }

  return -1;
};

/**
 * Check if a market has meaningful trading volume (non-zero).
 * Markets with zero, negative, or missing volume are considered inactive and
 * should be hidden from market lists.
 *
 * @param market - The market data to check
 * @returns True if the market has non-zero volume
 * @example
 * hasVolume({ volume: '$1.2M' }) // → true
 * hasVolume({ volume: '$0' })    // → false
 * hasVolume({ volume: '' })      // → false
 */
export const hasVolume = (market: PerpsMarketData): boolean => {
  return parseVolume(market.volume) > 0;
};

/**
 * Computes the PnL ratio for a position, returning `undefined` when it
 * cannot be determined.
 *
 * Primary: unrealizedPnl / marginUsed.
 * Fallback: returnOnEquity, which is already a ratio (e.g. 0.1579 for 15.79%).
 *
 * @param position - Position values used to compute the PnL ratio.
 * @param position.unrealizedPnl - Unrealized profit and loss as a string.
 * @param position.marginUsed - Margin used as a string.
 * @param position.returnOnEquity - Return on equity as a decimal ratio string (e.g. "0.1579").
 * @returns The PnL ratio (e.g. 0.15 for +15 %) or `undefined`.
 */
export const getPositionPnlRatio = (position: {
  unrealizedPnl: string;
  marginUsed: string;
  returnOnEquity: string;
}): number | undefined => {
  const unrealizedPnl = Number.parseFloat(position.unrealizedPnl);
  const marginUsed = Number.parseFloat(position.marginUsed);

  if (
    !Number.isNaN(unrealizedPnl) &&
    !Number.isNaN(marginUsed) &&
    marginUsed !== 0
  ) {
    return unrealizedPnl / marginUsed;
  }

  const returnOnEquity = parseFloat(position.returnOnEquity);
  if (!Number.isNaN(returnOnEquity)) {
    // position.returnOnEquity is a decimal ratio (e.g. 0.1579); pass directly to formatter.
    return returnOnEquity;
  }

  return undefined;
};

/**
 * Derives the TP/SL risk management type string for analytics.
 * Returns a value like 'create_tpsl', 'update_tp', 'create_sl', etc.
 *
 * @param options - Input values used to determine the type string.
 * @param options.takeProfitPrice - The take profit price, if set.
 * @param options.stopLossPrice - The stop loss price, if set.
 * @param options.hasExistingTpsl - Whether the position already has a TP or SL set.
 * @returns A type string such as 'create_tpsl', 'update_tp', or 'create_sl'.
 */
export const deriveTpslType = ({
  takeProfitPrice,
  stopLossPrice,
  hasExistingTpsl,
}: {
  takeProfitPrice: string | null | undefined;
  stopLossPrice: string | null | undefined;
  hasExistingTpsl: boolean;
}): string => {
  const prefix = hasExistingTpsl ? 'update' : 'create';
  if (takeProfitPrice && stopLossPrice) {
    return `${prefix}_tpsl`;
  }
  if (takeProfitPrice) {
    return `${prefix}_tp`;
  }
  if (stopLossPrice) {
    return `${prefix}_sl`;
  }
  return `${prefix}_tpsl`;
};
