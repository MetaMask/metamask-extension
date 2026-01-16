import type { PerpsMarketData } from '../../controllers/types';
import type { SortField } from '../../utils/sortMarkets';

/**
 * Props for PerpsMarketRowItem component
 */
export interface PerpsMarketRowItemProps {
  /**
   * Market data to display in the row
   */
  market: PerpsMarketData;
  /**
   * Callback when the row is pressed
   */
  onPress?: (market: PerpsMarketData) => void;
  /**
   * Size of the token icon (defaults to HOME_SCREEN_CONFIG.DEFAULT_ICON_SIZE)
   */
  iconSize?: number;
  /**
   * Metric to display in the subtitle area
   * - 'volume': Shows 24h trading volume (default)
   * - 'priceChange': Shows 24h price change percentage
   * - 'openInterest': Shows open interest value
   * - 'fundingRate': Shows current funding rate
   * @default 'volume'
   */
  displayMetric?: SortField;
  /**
   * Whether to show the market type badge (STOCK, COMMODITY, FOREX)
   * Should be true in watchlist (mixed types) but false in type-specific sections/tabs
   * @default true
   */
  showBadge?: boolean;
}
