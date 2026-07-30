import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  twMerge,
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  ButtonBase,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  AvatarTokenSize,
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

// `min-h-[72px]` is a deliberate safety net (matching the pattern used by
// PositionCard/OrderCard's `h-auto min-h-[Npx]`), not just a `h-auto`
// override of ButtonBase's default `h-12`: this row's two stacked text lines
// plus `py-3` padding need ~72px, and ButtonBase's `overflow-hidden` would
// otherwise silently clip/overlap adjacent rows if the height override were
// ever the losing side of a class conflict.
const ROW_STYLES =
  'justify-start rounded-none min-w-0 h-auto min-h-[72px] gap-3 text-left cursor-pointer bg-default px-4 py-3 hover:bg-hover active:bg-pressed';

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
    <ButtonBase
      className={twMerge(ROW_STYLES)}
      isFullWidth
      data-testid={testId}
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
          className="min-w-0 max-w-full"
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          <Text fontWeight={FontWeight.Medium} className="min-w-0 truncate">
            {displaySymbol}
          </Text>
          {market.maxLeverage && (
            <span className="shrink-0 rounded-md bg-background-muted px-1.5">
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.TextAlternative}
              >
                {market.maxLeverage}
              </Text>
            </span>
          )}
        </Box>
        <Box
          className="min-w-0 max-w-full"
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
        >
          {showTickerSuffix && (
            <>
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
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
          )}
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {metricValue}
          </Text>
        </Box>
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
          {formatSignedChangePercent(market.change24hPercent)}
        </Text>
      </Box>
    </ButtonBase>
  );
};

export default MarketRow;
