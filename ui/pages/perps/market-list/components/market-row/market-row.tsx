import React, { useCallback, useMemo } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  AvatarTokenSize,
} from '@metamask/design-system-react';
import { PerpsTokenLogo } from '../../../../../components/app/perps/perps-token-logo';
import { getDisplaySymbol } from '../../../../../components/app/perps/utils';
import type { PerpsMarketData } from '../../../../../components/app/perps/types';

export type SortField =
  | 'volume'
  | 'priceChange'
  | 'fundingRate'
  | 'openInterest';

export type MarketRowProps = {
  /** Market data to display */
  market: PerpsMarketData;
  /** Callback when row is pressed */
  onPress?: (market: PerpsMarketData) => void;
  /** Which metric to display below the symbol */
  displayMetric?: SortField;
};

/**
 * Get the metric value to display based on the sort field
 *
 * @param market - The market data
 * @param metric - The metric to display
 * @returns The formatted metric value
 */
const getMetricValue = (market: PerpsMarketData, metric: SortField): string => {
  switch (metric) {
    case 'volume':
      return `${market.volume} Vol`;
    case 'priceChange':
      return market.change24hPercent;
    case 'fundingRate':
      if (market.fundingRate === undefined) {
        return 'N/A';
      }
      return `${(market.fundingRate * 100).toFixed(4)}% FR`;
    case 'openInterest':
      return market.openInterest ? `${market.openInterest} OI` : 'N/A';
    default:
      return `${market.volume} Vol`;
  }
};

/**
 * MarketRow component displays individual market information
 * Shows token logo, symbol, leverage, metric, price, and 24h change
 *
 * @param options0 - Component props
 * @param options0.market - The market data to display
 * @param options0.onPress - Callback when row is pressed
 * @param options0.displayMetric - Which metric to display below the symbol
 */
export const MarketRow: React.FC<MarketRowProps> = ({
  market,
  onPress,
  displayMetric = 'volume',
}) => {
  const displaySymbol = useMemo(
    () => getDisplaySymbol(market.symbol),
    [market.symbol],
  );
  const metricValue = useMemo(
    () => getMetricValue(market, displayMetric),
    [market, displayMetric],
  );

  // Determine the appropriate color for price change
  const changeColor = useMemo(() => {
    const change = market.change24hPercent;
    if (!change || change === '--' || change === 'N/A') {
      return TextColor.TextAlternative; // Neutral for missing/placeholder data
    }
    if (change.startsWith('+')) {
      return TextColor.SuccessDefault; // Green for positive
    }
    if (change.startsWith('-')) {
      return TextColor.ErrorDefault; // Red for negative
    }
    return TextColor.TextAlternative; // Neutral for zero (e.g., '0%', '0.00%')
  }, [market.change24hPercent]);

  const handleClick = useCallback(() => {
    if (onPress) {
      onPress(market);
    }
  }, [onPress, market]);

  return (
    <Box
      className="cursor-pointer bg-default px-4 py-3 hover:bg-hover active:bg-pressed"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={3}
      data-testid={`market-row-${market.symbol.replace(/:/gu, '-')}`}
      onClick={handleClick}
    >
      {/* Token Logo */}
      <PerpsTokenLogo
        symbol={market.symbol}
        size={AvatarTokenSize.Md}
        className="shrink-0"
      />

      {/* Left side: Symbol, leverage, and metric */}
      <Box
        className="min-w-0 flex-1"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Start}
        gap={1}
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          <Text fontWeight={FontWeight.Medium}>{displaySymbol}</Text>
          <span className="shrink-0 rounded-md bg-background-muted px-1.5">
            <Text variant={TextVariant.BodyXs} color={TextColor.TextAlternative}>
              {market.maxLeverage}
            </Text>
          </span>
        </Box>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {metricValue}
        </Text>
      </Box>

      {/* Right side: Price and 24h change */}
      <Box
        className="shrink-0"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.End}
        gap={1}
      >
        <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
          {market.price}
        </Text>
        <Text variant={TextVariant.BodySm} color={changeColor}>
          {market.change24hPercent}
        </Text>
      </Box>
    </Box>
  );
};

export default MarketRow;
