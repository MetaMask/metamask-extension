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
  Icon,
  IconName,
  IconSize,
  IconColor,
  ButtonBase,
} from '@metamask/design-system-react';
import { PerpsTokenLogo } from '../../../../../components/app/perps/perps-token-logo';
import {
  getDisplaySymbol,
  getChangeColor,
} from '../../../../../components/app/perps/utils';
import type { PerpsMarketData } from '../../../../../components/app/perps/types';
import type { SortField } from '../../../utils/sortMarkets';

export type MarketRowProps = {
  /** Market data to display */
  market: PerpsMarketData;
  /** Callback when row is pressed */
  onPress?: (market: PerpsMarketData) => void;
  /** Which metric to display below the symbol */
  displayMetric?: SortField;
  /** Whether to show the watchlist star icon */
  showWatchlistIcon?: boolean;
  /** Whether this market is in the watchlist */
  isInWatchlist?: boolean;
  /** Callback to toggle watchlist status */
  onToggleWatchlist?: (symbol: string) => void;
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
 * @param options0.showWatchlistIcon - Whether to show the watchlist star icon
 * @param options0.isInWatchlist - Whether this market is in the watchlist
 * @param options0.onToggleWatchlist - Callback to toggle watchlist status
 */
export const MarketRow: React.FC<MarketRowProps> = ({
  market,
  onPress,
  displayMetric = 'volume',
  showWatchlistIcon = false,
  isInWatchlist = false,
  onToggleWatchlist,
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
      return TextColor.TextAlternative;
    }
    return getChangeColor(change);
  }, [market.change24hPercent]);

  const handleClick = useCallback(() => {
    if (onPress) {
      onPress(market);
    }
  }, [onPress, market]);

  const handleWatchlistClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onToggleWatchlist) {
        onToggleWatchlist(market.symbol);
      }
    },
    [onToggleWatchlist, market.symbol],
  );

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
            <Text
              variant={TextVariant.BodyXs}
              color={TextColor.TextAlternative}
            >
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

      {/* Watchlist star icon */}
      {showWatchlistIcon && (
        <ButtonBase
          className="shrink-0 p-1 bg-transparent hover:bg-hover active:bg-pressed rounded-full"
          onClick={handleWatchlistClick}
          data-testid={`market-row-watchlist-${market.symbol.replace(/:/gu, '-')}`}
        >
          <Icon
            name={isInWatchlist ? IconName.StarFilled : IconName.Star}
            size={IconSize.Md}
            color={
              isInWatchlist ? IconColor.WarningDefault : IconColor.IconMuted
            }
          />
        </ButtonBase>
      )}
    </Box>
  );
};

export default MarketRow;
