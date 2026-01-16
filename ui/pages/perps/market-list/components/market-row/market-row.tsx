import React, { useMemo } from 'react';
import { PerpsTokenLogo } from '../../../../../components/app/perps/perps-token-logo';
import { getDisplaySymbol } from '../../../../../components/app/perps/utils';
import type {
  PerpsMarketData,
  MarketType,
} from '../../../../../components/app/perps/types';
import { MarketBadge } from '../market-badge';
import type { SortField } from '../../../utils/sortMarkets';

export type MarketRowProps = {
  /** Market data to display */
  market: PerpsMarketData;
  /** Click handler for row selection */
  onPress?: (market: PerpsMarketData) => void;
  /** Which metric to display below the symbol (default: 'volume') */
  displayMetric?: SortField;
  /** Whether to show the market type badge (STOCK, COMMODITY, FOREX) */
  showBadge?: boolean;
  /** Additional CSS class */
  className?: string;
};

/**
 * Get the metric label for display
 *
 * @param field - The sort field to get label for
 * @returns The display label
 */
const getMetricLabel = (field: SortField): string => {
  switch (field) {
    case 'volume':
      return 'Vol';
    case 'priceChange':
      return '24h';
    case 'openInterest':
      return 'OI';
    case 'fundingRate':
      return 'FR';
    default:
      return 'Vol';
  }
};

/**
 * Get the metric value from market data
 *
 * @param market - The market data
 * @param field - The field to get value for
 * @returns The formatted metric value
 */
const getMetricValue = (market: PerpsMarketData, field: SortField): string => {
  switch (field) {
    case 'volume':
      return market.volume || '--';
    case 'priceChange':
      return market.change24hPercent || '--';
    case 'openInterest':
      return market.openInterest || '--';
    case 'fundingRate':
      if (market.fundingRate === undefined) {
        return '--';
      }
      return `${(market.fundingRate * 100).toFixed(4)}%`;
    default:
      return market.volume || '--';
  }
};

type PriceChangeStatus = 'positive' | 'negative' | 'neutral';

/**
 * Determine if the price change is positive, negative, or neutral
 *
 * @param change24hPercent - The 24h change percentage string
 * @returns The status category
 */
const getPriceChangeStatus = (
  change24hPercent: string | undefined,
): PriceChangeStatus => {
  if (!change24hPercent || change24hPercent === '--') {
    return 'neutral';
  }
  const value = parseFloat(change24hPercent.replace(/[%+]/gu, ''));
  if (isNaN(value) || value === 0) {
    return 'neutral';
  }
  return value > 0 ? 'positive' : 'negative';
};

/**
 * Get the CSS class for price change color
 *
 * @param status - The price change status
 * @returns The CSS class for the color
 */
const getPriceChangeColorClass = (status: PriceChangeStatus): string => {
  switch (status) {
    case 'positive':
      return 'text-success-default';
    case 'negative':
      return 'text-error-default';
    default:
      return 'text-text-alternative';
  }
};

/**
 * MarketRow - Individual market row for the market list
 *
 * Displays token logo, symbol, leverage, metric, price, and change.
 * Adapts HIP-3 market badges for equity, commodity, and forex markets.
 *
 * @param options0 - Component props
 * @param options0.market - Market data to display
 * @param options0.onPress - Click handler for row selection
 * @param options0.displayMetric - Which metric to display below the symbol
 * @param options0.showBadge - Whether to show the market type badge
 * @param options0.className - Additional CSS class
 */
export const MarketRow: React.FC<MarketRowProps> = ({
  market,
  onPress,
  displayMetric = 'volume',
  showBadge = false,
  className,
}) => {
  const displaySymbol = useMemo(
    () => getDisplaySymbol(market.symbol),
    [market.symbol],
  );

  const metricLabel = useMemo(
    () => getMetricLabel(displayMetric),
    [displayMetric],
  );

  const metricValue = useMemo(
    () => getMetricValue(market, displayMetric),
    [market, displayMetric],
  );

  const priceChangeStatus = useMemo(
    () => getPriceChangeStatus(market.change24hPercent),
    [market.change24hPercent],
  );

  const shouldShowBadge =
    showBadge && market.marketType && market.marketType !== 'crypto';

  // Sanitize symbol for test ID
  const sanitizedSymbol = market.symbol.replace(/:/gu, '-');

  const handleClick = () => {
    onPress?.(market);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onPress?.(market);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        flex justify-between items-center px-4 py-3 min-h-[72px]
        hover:bg-background-hover cursor-pointer
        transition-colors duration-150
        border-b border-border-muted last:border-b-0
        ${className ?? ''}
      `}
      data-testid={`market-row-${sanitizedSymbol}`}
    >
      {/* Left section */}
      <div className="flex items-center flex-1 min-w-0">
        {/* Token logo */}
        <PerpsTokenLogo symbol={market.symbol} className="mr-3 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          {/* Token header row: Symbol + Leverage */}
          <div className="flex items-center gap-2 mb-0.5">
            {/* Symbol */}
            <span className="text-sm font-medium text-text-default truncate">
              {displaySymbol}
            </span>
            {/* Leverage badge */}
            <span className="text-xs text-text-alternative px-1.5 py-0.5 bg-background-alternative rounded flex-shrink-0">
              {market.maxLeverage}
            </span>
          </div>

          {/* Metric row: Value + optional Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-alternative">
              {metricLabel} {metricValue}
            </span>
            {shouldShowBadge && (
              <MarketBadge
                type={market.marketType as Exclude<MarketType, 'crypto'>}
              />
            )}
          </div>
        </div>
      </div>

      {/* Right section */}
      <div className="flex flex-col items-end flex-shrink-0 ml-3">
        {/* Price */}
        <span className="text-sm font-medium text-text-default">
          {market.price}
        </span>
        {/* Change percentage */}
        <span
          className={`text-xs font-medium ${getPriceChangeColorClass(priceChangeStatus)}`}
        >
          {market.change24hPercent || '--'}
        </span>
      </div>
    </div>
  );
};

export default MarketRow;
