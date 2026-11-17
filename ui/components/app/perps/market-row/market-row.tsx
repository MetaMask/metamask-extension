import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ContentVariant,
  ListItem,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { PerpsTokenLogo } from '../perps-token-logo';
import {
  getDisplaySymbol,
  getChangeColor,
  formatSignedChangePercent,
} from '../utils';
import { getIsPerpsShowFullAssetNamesEnabled } from '../../../../selectors/perps/feature-flags';
import { useFormatters } from '../../../../hooks/useFormatters';
import type { PerpsMarketData } from '../types';

/**
 * Which metric to display below the symbol. Mirrors `SortField` from
 * `ui/pages/perps/utils/sortMarkets` (kept as a local structural type so this
 * shared component doesn't depend on a page-scoped module).
 */
export type MarketRowDisplayMetric =
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
  displayMetric?: MarketRowDisplayMetric;
  /**
   * Optional test id override. Defaults to
   * `market-row-${symbol with ':' replaced by '-'}` for callers (e.g. the
   * Market List page) that don't need a custom convention.
   */
  'data-testid'?: string;
};

/**
 * Get the metric value to display based on the sort field
 *
 * @param market - The market data
 * @param metric - The metric to display
 * @param formatNumber - Number formatting function from useFormatters
 * @returns The formatted metric value
 */
const getMetricValue = (
  market: PerpsMarketData,
  metric: MarketRowDisplayMetric,
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string,
): string => {
  switch (metric) {
    case 'volume':
      return `${market.volume} Vol`;
    case 'priceChange':
      return formatSignedChangePercent(market.change24hPercent);
    case 'fundingRate':
      if (market.fundingRate === undefined) {
        return 'N/A';
      }
      return `${formatNumber(market.fundingRate * 100, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      })}% FR`;
    case 'openInterest':
      return market.openInterest ? `${market.openInterest} OI` : 'N/A';
    default:
      return `${market.volume} Vol`;
  }
};

/**
 * MarketRow displays individual market information: token logo, symbol,
 * leverage, a metric (volume/price change/funding rate/open interest),
 * price, and 24h change. Shared by the Market List page as well as the
 * Perps Home tab's Explore Markets and Watchlist sections.
 *
 * @param options0 - Component props
 * @param options0.market - The market data to display
 * @param options0.onPress - Callback when row is pressed
 * @param options0.displayMetric - Which metric to display below the symbol
 * @param options0.'data-testid' - Optional test id override
 */
export const MarketRow = ({
  market,
  onPress,
  displayMetric = 'volume',
  'data-testid': testIdOverride,
}: MarketRowProps) => {
  const { formatNumber } = useFormatters();
  const showFullAssetNames = useSelector(getIsPerpsShowFullAssetNamesEnabled);
  const displaySymbol = useMemo(
    () =>
      getDisplaySymbol(
        showFullAssetNames ? market.name || market.symbol : market.symbol,
      ),
    [showFullAssetNames, market.name, market.symbol],
  );
  const displayTicker = useMemo(
    () => getDisplaySymbol(market.symbol),
    [market.symbol],
  );
  // The title above already falls back to the ticker when there's no name
  // (or the flag is off), so the suffix is only needed when a full name is
  // actually being shown. This also guards HIP-3 markets where the resolved
  // name is the bare ticker (e.g. symbol "xyz:AAPL", name "AAPL"), which
  // would otherwise duplicate the ticker.
  const showTickerSuffix = displaySymbol !== displayTicker;
  const metricValue = useMemo(
    () => getMetricValue(market, displayMetric, formatNumber),
    [market, displayMetric, formatNumber],
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

  const testId =
    testIdOverride ?? `market-row-${market.symbol.replace(/:/gu, '-')}`;

  return (
    <ListItem
      variant={ContentVariant.TwoLines}
      isInteractive
      onClick={handleClick}
      className="rounded-none bg-default text-left hover:bg-hover"
      data-testid={testId}
      avatar={
        <PerpsTokenLogo
          symbol={market.symbol}
          size={AvatarTokenSize.Lg}
          className="shrink-0"
        />
      }
      title={displaySymbol}
      titleProps={{ className: 'block max-w-full truncate' }}
      titleEndAccessory={
        market.maxLeverage ? (
          <span className="shrink-0 rounded-md bg-background-muted px-1.5">
            <Text
              variant={TextVariant.BodyXs}
              color={TextColor.TextAlternative}
            >
              {market.maxLeverage}
            </Text>
          </span>
        ) : undefined
      }
      description={
        <Box
          className="min-w-0 max-w-full"
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
        >
          {showTickerSuffix ? (
            <>
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
                className="block max-w-full truncate"
                data-testid={`market-row-ticker-${market.symbol.replace(/:/gu, '-')}`}
              >
                {displayTicker}
              </Text>
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                {'\u00B7'}
              </Text>
            </>
          ) : null}
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            className="block max-w-full truncate"
          >
            {metricValue}
          </Text>
        </Box>
      }
      value={market.price}
      valueProps={{
        variant: TextVariant.BodySm,
        className: 'block max-w-full truncate text-right',
      }}
      subvalue={formatSignedChangePercent(market.change24hPercent)}
      subvalueProps={{
        variant: TextVariant.BodySm,
        color: changeColor,
        className: 'block max-w-full truncate text-right',
      }}
    />
  );
};

export default MarketRow;
