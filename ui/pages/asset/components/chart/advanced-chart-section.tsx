import React, { type CSSProperties, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { Box, BoxFlexDirection, Skeleton } from '@metamask/design-system-react';
import { getIsAdvancedChartsThemingEnabled } from '../../../../selectors/multichain/feature-flags';
import { useHistoricalPrices } from '../../hooks/useHistoricalPrices';
import { computePercentChange } from '../../../../components/app/assets/util/percentChange';
import AdvancedChartIframe from './advanced-chart-iframe';
import IndicatorBar from './advanced-chart-indicator-bar';
import IntervalBar, {
  LINE_CHART_TIME_RANGES,
  LINE_TIME_RANGE_TO_ISO8601,
} from './advanced-chart-interval-bar';
import { AssetChartBody, type HoveredPoint } from './asset-chart-body';
import ChartErrorState from './chart-error-state';
import TokenPriceHeader from './token-price-header';
import { useAdvancedChartData } from './useAdvancedChartData';
import { useAdvancedChartPreferences } from './useAdvancedChartPreferences';

/**
 * The aspect ratio of the legacy chart's plot area, from
 * {@link initialChartOptions} in `asset-chart-body.tsx`.
 */
const CHART_ASPECT_RATIO = 2.6;

/**
 * Height of one of the legacy chart's min/max price labels: a 20px line of
 * `bodyXs` text with 4px of margin either side. The line chart stacks one
 * above and one below its plot, so candle mode has to account for both or
 * everything below the chart moves when the two swap.
 *
 * `asset.scss` hardcodes the same 28px to pad the chart empty state, which
 * has no labels of its own, for exactly this reason.
 */
const PRICE_LABEL_ROW_HEIGHT = 28;

/**
 * Puts a chart in the single shared grid cell. Both modes render into the same
 * cell, so the row is as tall as the taller of the two and neither one's
 * presence moves the other. `start` alignment matters: grid items stretch by
 * default, which would override the candle frame's aspect ratio.
 *
 * `minWidth: 0` releases the automatic minimum size. Without it a grid item
 * cannot be narrower than its min-content, and Chart.js writes a pixel width
 * onto its canvas from the last measurement, so the cell would stay pinned to
 * whatever width the panel used to be.
 */
const STACKED: CSSProperties = {
  gridRow: 1,
  gridColumn: 1,
  alignSelf: 'start',
  minWidth: 0,
};

/**
 * Takes the inactive chart off screen without disturbing it. `visibility`
 * rather than `display` because the box, and with it the iframe's width and
 * height, has to survive: TradingView re-measures on resize, and collapsing
 * it to nothing would make every toggle look like a reload.
 */
const OFFSCREEN: CSSProperties = {
  visibility: 'hidden',
  pointerEvents: 'none',
};

const DEFAULT_LINE_ISO8601 = 'P1D';

export type AdvancedChartSectionProps = {
  chainId: Hex;
  address: string;
  /** CAIP asset id, absent for assets the price API cannot identify. */
  caipAssetId?: string;
  currency: string;
  currentPrice?: number;
};

/**
 * The Token Details Page chart when the advanced charts flag is on.
 *
 * Both modes share one hoisted price header and one IntervalBar, so toggling
 * between them moves nothing on screen. What changes underneath is the chart
 * and where the header's numbers come from:
 *
 * - Line mode renders the legacy Chart.js chart on historical prices, with the
 *   header derived from those same prices so the two always agree on a range.
 * - Candle mode renders the TradingView iframe, with the header derived from
 *   the OHLCV candles that feed it.
 *
 * In both modes the live OHLCV bar drives the current price, mirroring mobile.
 */
export const AdvancedChartSection = ({
  chainId,
  address,
  caipAssetId,
  currency,
  currentPrice,
}: AdvancedChartSectionProps) => {
  const {
    chartType,
    interval,
    lineTimeRange,
    indicators,
    setChartType,
    setCandleInterval,
    setLineTimeRange,
    toggleIndicator,
    isLineChart,
  } = useAdvancedChartPreferences();

  const [chartError, setChartError] = useState<string | null>(null);
  const [chartReady, setChartReady] = useState(false);
  const [hovered, setHovered] = useState<HoveredPoint | null>(null);

  // Mount the iframe only once the user actually asks for candles, then keep
  // it mounted so toggling back and forth does not re-initialise the engine.
  // Users who never leave line mode never download the chart library, and the
  // load timeout never fires for them.
  const [hasEnteredCandleMode, setHasEnteredCandleMode] =
    useState(!isLineChart);
  if (!isLineChart && !hasEnteredCandleMode) {
    setHasEnteredCandleMode(true);
  }

  // Clear a stale error when the token, interval, or chart type changes, so
  // one transient failure does not pin the error state for the rest of the
  // session. Chart type is included so toggling to Line and back — the
  // recovery the error copy tells users to try — remounts the iframe and
  // retries rather than leaving candle mode stuck on the error state. Done
  // during render rather than in an effect so the stale error is never
  // painted. https://react.dev/reference/react/useState#storing-information-from-previous-renders
  //
  // `chartReady` is deliberately NOT reset here: the iframe is kept mounted
  // across token/interval changes (those are sent via postMessage, not a
  // reload), so the engine stays ready and only re-emits CHART_READY on an
  // actual reload. Resetting it would hide the indicator bar on every interval
  // switch with nothing to turn it back on. Instead it is a one-way "has been
  // ready" latch, mirroring mobile's `hasChartBeenRevealed`.
  const seriesKey = `${caipAssetId ?? ''}|${interval}|${chartType}`;
  const [renderedSeriesKey, setRenderedSeriesKey] = useState(seriesKey);
  if (renderedSeriesKey !== seriesKey) {
    setRenderedSeriesKey(seriesKey);
    setChartError(null);
  }

  const handleChartReady = useCallback(() => {
    setChartReady(true);
    setChartError(null);
  }, []);

  const {
    ohlcvData,
    realtimeBar,
    realtimePrice,
    realtimeTimestamp,
    price: ohlcvPrice,
    percentChange: ohlcvPercentChange,
    timestamp: ohlcvTimestamp,
    isLoading: isOhlcvLoading,
    error: ohlcvError,
    resolvedCurrency,
    fetchOlderBars,
  } = useAdvancedChartData({
    assetId: caipAssetId,
    interval,
    currency,
    needsHistory: !isLineChart,
  });

  const historical = useHistoricalPrices({
    chainId,
    address,
    currency,
    timeRange:
      LINE_TIME_RANGE_TO_ISO8601[lineTimeRange] ?? DEFAULT_LINE_ISO8601,
    enabled: isLineChart,
  });

  // Line mode anchors the header to the opening price of the range the chart
  // is actually showing, so the two can never disagree. Releasing a hover
  // falls back to the live price rather than a stale snapshot.
  const linePrice = hovered?.price ?? realtimePrice ?? currentPrice;
  const lineHeader = {
    price: linePrice,
    percentChange: computePercentChange(
      linePrice,
      historical.isPlaceholderData ? undefined : historical.data.prices?.[0]?.y,
    ),
    timestamp: hovered?.date ?? realtimeTimestamp,
    loading: historical.loading || historical.isPlaceholderData,
    currency,
  };

  // Colour the line by the range's overall direction rather than the hovered
  // point, so the colour stays stable as the pointer moves across the chart.
  // Reuses the existing success/error tokens — the same green as before and
  // the same red the percent-change header already uses — and falls back to
  // green when the direction is unknown (loading, flat, or missing data).
  const isThemingEnabled = useSelector(getIsAdvancedChartsThemingEnabled);
  const lineRangeChange = computePercentChange(
    realtimePrice ?? currentPrice,
    historical.isPlaceholderData ? undefined : historical.data.prices?.[0]?.y,
  );
  const lineColorVar =
    isThemingEnabled &&
    typeof lineRangeChange === 'number' &&
    lineRangeChange < 0
      ? '--color-error-default'
      : '--color-success-default';

  const candleHeader = {
    price: ohlcvPrice,
    percentChange: ohlcvPercentChange,
    timestamp: ohlcvTimestamp,
    loading: isOhlcvLoading,
    // The price API does not quote every fiat, so label whatever came back.
    currency: resolvedCurrency,
  };

  const header = isLineChart ? lineHeader : candleHeader;
  const candleFailed = Boolean(chartError ?? ohlcvError);

  // A finished fetch that returned no candles is a success, not an error, so it
  // never sets `ohlcvError`. Surface the shared "No data" placeholder instead
  // of leaving an empty chart. `useOHLCVChart` resets to `isLoading` the moment
  // the series changes, so an empty `ohlcvData` with loading already settled is
  // a genuine "no data" result rather than the idle pre-fetch frame — no extra
  // gating is needed here to avoid flashing the placeholder.
  const candleEmpty =
    !isLineChart &&
    !isOhlcvLoading &&
    !candleFailed &&
    Boolean(caipAssetId) &&
    ohlcvData.length === 0;
  const showIndicatorBar =
    !isLineChart && chartReady && !candleFailed && !candleEmpty;

  let candleChart;
  if (candleFailed || candleEmpty) {
    candleChart = <ChartErrorState />;
  } else if (caipAssetId) {
    candleChart = (
      <AdvancedChartIframe
        assetId={caipAssetId}
        chartType={chartType}
        selectedInterval={interval}
        currency={resolvedCurrency}
        activeIndicators={indicators}
        ohlcvData={ohlcvData}
        onError={setChartError}
        onReady={handleChartReady}
        realtimeBar={realtimeBar}
        fetchOlderBars={fetchOlderBars}
      />
    );
  } else {
    candleChart = (
      <Skeleton
        style={{ width: '100%', height: '100%', borderRadius: '1rem' }}
      />
    );
  }

  return (
    <Box className="flex rounded-lg" flexDirection={BoxFlexDirection.Column}>
      <TokenPriceHeader
        price={header.price}
        percentChange={header.percentChange}
        currency={header.currency}
        timestamp={header.timestamp}
        loading={header.loading}
      />

      <IntervalBar
        intervals={isLineChart ? LINE_CHART_TIME_RANGES : undefined}
        selectedInterval={isLineChart ? lineTimeRange : interval}
        onIntervalSelect={isLineChart ? setLineTimeRange : setCandleInterval}
        chartType={chartType}
        onChartTypeSelect={setChartType}
      />

      {/* Both modes share one grid cell rather than taking turns in the tree.
          Swapping them would tear down the TradingView engine and replay its
          whole load, so the inactive one is hidden in place instead.
          `minmax(0, 1fr)` rather than the implicit `auto`: an `auto` track is
          floored at its items' min-content, which stops the chart following
          the panel as it narrows. */}
      <Box style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <Box
          data-testid="legacy-chart-slot"
          style={isLineChart ? STACKED : { ...STACKED, ...OFFSCREEN }}
        >
          <AssetChartBody
            prices={historical.data.prices}
            metadata={historical.data.metadata}
            loading={historical.loading}
            isFetching={historical.isFetching}
            isPlaceholderData={historical.isPlaceholderData}
            currency={currency}
            currentPrice={currentPrice}
            realtimePrice={realtimePrice}
            realtimeTimestamp={realtimeTimestamp}
            onHoverPrice={setHovered}
            lineColorVar={lineColorVar}
          />
        </Box>

        {/* Sized to occupy exactly what the line chart's plot-plus-labels
            stack occupies, so the grid row is the same height either way. The
            ratio applies to the content box and the block padding stands in
            for the two price-label rows, giving a total of W/2.6 + 56. The
            contents are absolutely positioned so they fill that whole padding
            box rather than only the content box — the labels belong to the
            engine inside the iframe, so the reserved space goes to the chart
            instead of sitting empty. */}
        {hasEnteredCandleMode && (
          <Box
            data-testid="advanced-chart-frame"
            marginTop={4}
            style={{
              ...STACKED,
              ...(isLineChart ? OFFSCREEN : {}),
              position: 'relative',
              aspectRatio: `${CHART_ASPECT_RATIO}`,
              boxSizing: 'content-box',
              paddingBlock: PRICE_LABEL_ROW_HEIGHT,
            }}
          >
            <Box
              className="flex"
              flexDirection={BoxFlexDirection.Column}
              style={{ position: 'absolute', inset: 0 }}
            >
              <Box
                className="flex"
                flexDirection={BoxFlexDirection.Column}
                style={{ flex: 1, minHeight: 0 }}
              >
                {candleChart}
              </Box>
              {/* Studies are candlestick-only and meaningless until the
                  engine is up, but the bar still holds its place so the chart
                  above it does not resize the moment CHART_READY lands.
                  `isLineChart` has to be checked here as well as on the frame:
                  a descendant's `visible` overrides an ancestor's `hidden`,
                  so the bar would otherwise show through in line mode. */}
              <Box
                data-testid="advanced-chart-indicator-slot"
                style={{
                  visibility: showIndicatorBar ? 'visible' : 'hidden',
                }}
              >
                <IndicatorBar
                  activeIndicators={indicators}
                  onIndicatorToggle={toggleIndicator}
                  onMAToggle={toggleIndicator}
                />
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AdvancedChartSection;
