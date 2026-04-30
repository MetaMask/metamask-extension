import React, {
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  createChart,
  IChartApi,
  CandlestickSeries,
  HistogramSeries,
  ISeriesApi,
  // @ts-expect-error suppress CommonJS vs ECMAScript error
} from 'lightweight-charts';
import { useSelector } from 'react-redux';
import { brandColor } from '@metamask/design-tokens';
import { Box } from '@metamask/design-system-react';
import type { CandleData, CandleStick } from '@metamask/perps-controller';
import { PRICE_THRESHOLD } from '../../../../../shared/lib/perps-formatters';
import { CandlePeriod, ZOOM_CONFIG } from '../constants/chartConfig';
import { useTheme } from '../../../../hooks/useTheme';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import {
  formatCandleDataForChart,
  formatVolumeDataForChart,
  formatSingleCandleForChart,
  formatSingleVolumeForChart,
  formatChartTimestamp,
} from './chart-utils';

/**
 * Derive lightweight-charts priceFormat options from a representative price,
 * mirroring the decimal precision rules in PRICE_RANGES_UNIVERSAL so the
 * y-axis always shows the same number of decimal places as the header price.
 *
 * @param price - Representative asset price (e.g. current mark price).
 * @returns precision and minMove for a lightweight-charts priceFormat object.
 */
export function getPriceFormatForPrice(price: number): {
  precision: number;
  minMove: number;
} {
  const abs = Math.abs(price);
  if (abs > PRICE_THRESHOLD.HIGH) {
    // > $10,000 (includes > $100,000): 0 decimals
    return { precision: 0, minMove: 1 };
  }
  if (abs > PRICE_THRESHOLD.LARGE) {
    // $1,000–$10,000: max 1 decimal
    return { precision: 1, minMove: 0.1 };
  }
  if (abs > PRICE_THRESHOLD.MEDIUM) {
    // $100–$1,000: max 2 decimals
    return { precision: 2, minMove: 0.01 };
  }
  if (abs > PRICE_THRESHOLD.MEDIUM_LOW) {
    // $10–$100: max 3 decimals
    return { precision: 3, minMove: 0.001 };
  }
  if (abs > PRICE_THRESHOLD.VERY_LOW) {
    // $1–$10: max 4 decimals
    return { precision: 4, minMove: 0.0001 };
  }
  if (abs > PRICE_THRESHOLD.EXTRA_LOW) {
    // $0.1–$1: max 5 decimals
    return { precision: 5, minMove: 0.00001 };
  }
  if (abs > PRICE_THRESHOLD.LOW) {
    // $0.01–$0.1: max 6 decimals
    return { precision: 6, minMove: 0.000001 };
  }
  // < $0.01 (including very small values): 6 decimals
  return { precision: 6, minMove: 0.000001 };
}

/** Cooldown in ms between load-more requests to avoid spamming */
const LOAD_MORE_COOLDOWN_MS = 2000;

/** Logical range threshold: request more history when user scrolls this close to left edge */
const EDGE_DETECTION_THRESHOLD = 5;

/**
 * A horizontal price line to draw on the chart (e.g., TP, Entry, SL, current price).
 */
export type ChartPriceLine = {
  /** Price level to draw the line at */
  price: number;
  /** Label displayed on the price axis (e.g., "TP", "Entry", "SL", or "" for no title) */
  label: string;
  /** Line color */
  color: string;
  /** Line style: 0 = solid, 1 = dotted, 2 = dashed (default 2) */
  lineStyle?: number;
  /** Line width in pixels (default 1) */
  lineWidth?: number;
};

type PerpsCandlestickChartProps = {
  /** Height of the chart in pixels */
  height?: number;
  /** Selected candle period */
  selectedPeriod?: CandlePeriod;
  /** Candle data to display. When null/undefined the parent handles loading/error states. */
  candleData?: CandleData | null;
  /**
   * Representative current price of the asset, used to derive y-axis decimal
   * precision. When provided, the y-axis will show the same number of decimal
   * places as the formatted header price (e.g. 1 decimal for ETH ~$2,332).
   */
  currentPrice?: number;
  /** Horizontal price lines to overlay on the chart (TP, Entry, SL, etc.) */
  priceLines?: ChartPriceLine[];
  /** Callback when data needs to be fetched for a new period */
  onPeriodDataRequest?: (period: CandlePeriod) => void;
  /** Callback when user scrolls near the left edge and more history is needed */
  onNeedMoreHistory?: () => void;
  /** Callback when crosshair moves over a candle (for OHLCV bar). null = crosshair left chart. */
  onCrosshairMove?: (candle: CandleStick | null) => void;
};

export type PerpsCandlestickChartRef = {
  /** Apply zoom to show a specific number of candles */
  applyZoom: (candleCount: number, forceReset?: boolean) => void;
  /** Scroll to the most recent candles */
  scrollToRealTime: () => void;
  /** Get current chart instance */
  getChart: () => IChartApi | null;
};

/**
 * PerpsCandlestickChart component
 * Displays a candlestick chart using TradingView's Lightweight Charts library
 *
 * Supports:
 * - Live data updates via incremental update() for efficiency
 * - Edge detection for scroll-left load-more history
 * - Crosshair move callbacks for OHLCV bar overlay
 *
 * ATTRIBUTION NOTICE:
 * TradingView Lightweight Charts™
 * Copyright (c) 2025 TradingView, Inc. https://www.tradingview.com/
 */
const PerpsCandlestickChart = forwardRef<
  PerpsCandlestickChartRef,
  PerpsCandlestickChartProps
>(
  (
    {
      height = 250,
      selectedPeriod = CandlePeriod.FiveMinutes,
      candleData,
      currentPrice,
      priceLines,
      onPeriodDataRequest,
      onNeedMoreHistory,
      onCrosshairMove,
    },
    ref,
  ) => {
    const theme = useTheme();
    const isDark = theme === 'dark';
    const locale = useSelector(getIntlLocale);

    // Theme-aware colors matching mobile semantic tokens
    const upColor = isDark ? brandColor.lime100 : brandColor.lime500;
    const downColor = isDark ? brandColor.red300 : brandColor.red500;
    // Volume bars use the same hue but at ~37% opacity so they don't overpower the candles
    const volumeUpColor = `${upColor}60`;
    const volumeDownColor = `${downColor}60`;
    const textColor = isDark
      ? 'rgba(255, 255, 255, 0.4)'
      : 'rgba(0, 0, 0, 0.4)';
    const gridColor = isDark
      ? 'rgba(255, 255, 255, 0.06)'
      : 'rgba(0, 0, 0, 0.06)';
    const crosshairColor = isDark
      ? 'rgba(255, 255, 255, 0.4)'
      : 'rgba(0, 0, 0, 0.4)';

    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const dataLengthRef = useRef<number>(0);
    const previousPeriodRef = useRef<CandlePeriod>(selectedPeriod);

    // Track previous candle data for incremental update optimization
    const prevCandleCountRef = useRef<number>(0);
    const prevLastCandleTimeRef = useRef<number>(0);
    // Track the symbol+interval the series was last filled with so we can
    // force a full setData when the user switches markets or timeframes.
    // Without this, rapid switches (e.g. xyz:AAPL → xyz:GOLD) can coincide
    // with the new series having the same length as the old one, sending
    // the new symbol's candle through the `.update()` path and triggering
    // lightweight-charts' "Cannot update oldest data" crash.
    const prevSymbolRef = useRef<string | null>(null);
    const prevIntervalRef = useRef<string | null>(null);

    // Edge detection cooldown
    const lastLoadMoreTimeRef = useRef<number>(0);

    // Suppress crosshair callback during our own data updates to avoid update loop:
    // update()/setData() can cause the library to emit crosshair move → parent setState → re-render → effect runs again.
    const isApplyingDataUpdateRef = useRef<boolean>(false);

    // Track created price line objects for cleanup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activePriceLinesRef = useRef<any[]>([]);

    // Stable refs for callbacks (avoid re-subscribing on every render)
    const onNeedMoreHistoryRef = useRef(onNeedMoreHistory);
    onNeedMoreHistoryRef.current = onNeedMoreHistory;
    const onCrosshairMoveRef = useRef(onCrosshairMove);
    onCrosshairMoveRef.current = onCrosshairMove;

    // Handle window resize
    const handleResize = useCallback(() => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    }, []);

    // Apply zoom to show specific number of candles (matches mobile pattern)
    const applyZoom = useCallback((candleCount: number, forceReset = false) => {
      if (!chartRef.current || dataLengthRef.current === 0) {
        return;
      }

      const actualCount = Math.max(
        ZOOM_CONFIG.MIN_CANDLES,
        Math.min(ZOOM_CONFIG.MAX_CANDLES, candleCount),
      );

      const dataLength = dataLengthRef.current;
      const from = Math.max(0, dataLength - actualCount);
      const to = dataLength - 1 + 2; // +2 for right padding

      chartRef.current.timeScale().setVisibleLogicalRange({ from, to });

      if (forceReset) {
        chartRef.current.timeScale().scrollToRealTime();
      }
    }, []);

    // Scroll to most recent candles
    const scrollToRealTime = useCallback(() => {
      if (chartRef.current) {
        chartRef.current.timeScale().scrollToRealTime();
      }
    }, []);

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        applyZoom,
        scrollToRealTime,
        getChart: () => chartRef.current,
      }),
      [applyZoom, scrollToRealTime],
    );

    // Initialize chart
    useEffect(() => {
      if (!containerRef.current) {
        return;
      }

      // Create chart instance
      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height,
        layout: {
          background: { color: 'transparent' },
          textColor,
          attributionLogo: false,
          panes: {
            separatorColor: 'transparent',
            separatorHoverColor: 'transparent',
            enableResize: false,
          },
        },
        localization: {
          locale,
          timeFormatter: (time: number) =>
            formatChartTimestamp(time, null, true, locale),
        },
        grid: {
          vertLines: { color: gridColor },
          horzLines: { color: gridColor },
        },
        crosshair: {
          mode: 1, // Normal crosshair mode
          vertLine: {
            visible: true,
            labelVisible: true,
            width: 1,
            style: 3, // Dotted line
            color: crosshairColor,
          },
          horzLine: {
            visible: true,
            labelVisible: true,
            width: 1,
            style: 3,
            color: crosshairColor,
          },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: 'transparent',
          tickMarkFormatter: (
            time: number,
            tickMarkType: number,
            chartLocale: string,
          ) => formatChartTimestamp(time, tickMarkType, false, chartLocale),
        },
        rightPriceScale: {
          borderColor: 'transparent',
          visible: true,
          autoScale: true,
        },
        leftPriceScale: {
          visible: false,
        },
        handleScroll: true,
        handleScale: true,
      });

      chartRef.current = chart;

      // Create candlestick series (pane 0 - top)
      // priceFormat mirrors mobile (TradingViewChartTemplate.tsx:697): allow up to
      // 6 decimals with a minMove of 1e-6 so small-value assets (PUMP at $0.001824)
      // render real digits on the Y axis instead of rounding to $0.00.
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor,
        downColor,
        borderVisible: false,
        wickUpColor: upColor,
        wickDownColor: downColor,
        priceLineVisible: false,
        lastValueVisible: false,
        priceFormat: {
          type: 'price',
          precision: 6,
          minMove: 0.000001,
        },
      });

      seriesRef.current = candlestickSeries;

      // Create volume histogram series (pane 1 - bottom)
      const volumeSeries = chart.addSeries(
        HistogramSeries,
        {
          color: volumeUpColor, // Default to bullish color (semi-transparent)
          priceFormat: { type: 'volume' },
          priceScaleId: '', // Independent price scale
          lastValueVisible: false,
          priceLineVisible: false,
        },
        1, // Pane index 1 = bottom pane
      );

      // Hide volume price scale
      volumeSeries.priceScale().applyOptions({
        visible: false,
        scaleMargins: { top: 0.1, bottom: 0.2 },
      });

      volumeSeriesRef.current = volumeSeries;

      // Set pane heights (80/20 split)
      setTimeout(() => {
        const panes = chart.panes();
        if (panes.length >= 2) {
          const mainHeight = Math.floor(height * 0.8);
          const volumeHeight = Math.floor(height * 0.2);
          panes[0].setHeight(mainHeight);
          panes[1].setHeight(volumeHeight);
        }
      }, 50);

      // Edge detection: request more history when user scrolls near left edge
      chart.timeScale().subscribeVisibleLogicalRangeChange((logicalRange) => {
        if (!logicalRange || !onNeedMoreHistoryRef.current) {
          return;
        }

        if (logicalRange.from <= EDGE_DETECTION_THRESHOLD) {
          const now = Date.now();
          if (now - lastLoadMoreTimeRef.current >= LOAD_MORE_COOLDOWN_MS) {
            lastLoadMoreTimeRef.current = now;
            onNeedMoreHistoryRef.current();
          }
        }
      });

      // Crosshair move: report hovered candle for OHLCV bar
      chart.subscribeCrosshairMove((param) => {
        // Skip during our own data updates to prevent loop: update/setData → crosshair → setState → re-render → effect → update
        if (isApplyingDataUpdateRef.current || !onCrosshairMoveRef.current) {
          return;
        }

        if (!param.time || !param.seriesData || param.seriesData.size === 0) {
          // Crosshair left the chart area
          onCrosshairMoveRef.current(null);
          return;
        }

        // Get the OHLCV data from the candlestick series
        const candleSeriesData = param.seriesData.get(candlestickSeries);
        if (candleSeriesData && 'open' in candleSeriesData) {
          const timeInMs = (param.time as number) * 1000;
          // Build a CandleStick object for the OHLCV bar
          const hoveredCandle: CandleStick = {
            time: timeInMs,
            open: String(candleSeriesData.open),
            high: String(candleSeriesData.high),
            low: String(candleSeriesData.low),
            close: String(candleSeriesData.close),
            volume: '0', // Volume from histogram series if needed
          };

          // Try to get volume from the histogram series
          const volumeData = param.seriesData.get(volumeSeries);
          if (volumeData && 'value' in volumeData) {
            hoveredCandle.volume = String(volumeData.value);
          }

          onCrosshairMoveRef.current(hoveredCandle);
        }
      });

      // Add resize listener
      window.addEventListener('resize', handleResize);

      // Cleanup on unmount / before effect re-runs (e.g. theme change)
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          seriesRef.current = null;
          volumeSeriesRef.current = null;
        }
        // Reset data-tracking refs so the data-update effect issues a full
        // setData() on the new chart rather than a single-candle update().
        prevCandleCountRef.current = 0;
        prevLastCandleTimeRef.current = 0;
        prevSymbolRef.current = null;
        prevIntervalRef.current = null;
        dataLengthRef.current = 0;
      };
    }, [
      height,
      handleResize,
      theme,
      upColor,
      downColor,
      volumeUpColor,
      volumeDownColor,
      textColor,
      gridColor,
      crosshairColor,
      locale,
    ]);

    // Update chart data when candleData or selectedPeriod changes
    useEffect(() => {
      if (!seriesRef.current || !chartRef.current || !candleData) {
        return;
      }

      isApplyingDataUpdateRef.current = true;

      const { candles } = candleData;
      const currentCount = candles.length;
      const currentLastTime =
        currentCount > 0 ? candles[currentCount - 1].time : 0;

      const prevCount = prevCandleCountRef.current;
      const prevLastTime = prevLastCandleTimeRef.current;

      // Check if period changed (requires full data replacement)
      const periodChanged = previousPeriodRef.current !== selectedPeriod;
      previousPeriodRef.current = selectedPeriod;

      // A symbol or interval switch means the series must be rebuilt from
      // scratch — the new market's candle times are unrelated to the old
      // market's, so an incremental update would violate lightweight-charts'
      // monotonic-time invariant.
      const symbolChanged = prevSymbolRef.current !== candleData.symbol;
      const intervalChanged = prevIntervalRef.current !== candleData.interval;
      const seriesIdentityChanged = symbolChanged || intervalChanged;

      // Determine update strategy:
      // 1. Same count + same last candle time = live tick update (replace last candle in-place)
      // 2. Count increased by 1 + previous last time still present = new candle appended
      // 3. Otherwise = full replacement (period change, symbol switch, initial load, fetch-more merge)
      const isLiveTick =
        !periodChanged &&
        !seriesIdentityChanged &&
        prevCount > 0 &&
        currentCount === prevCount &&
        currentLastTime === prevLastTime;

      const isAppend =
        !periodChanged &&
        !seriesIdentityChanged &&
        prevCount > 0 &&
        currentCount === prevCount + 1;

      if (isLiveTick || isAppend) {
        // Incremental update — only update the last candle
        const lastCandle = candles[currentCount - 1];
        const formattedCandle = formatSingleCandleForChart(lastCandle);
        const formattedVolume = formatSingleVolumeForChart(
          lastCandle,
          volumeUpColor,
          volumeDownColor,
        );

        if (formattedCandle && seriesRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          seriesRef.current.update(formattedCandle as any);
        }
        if (formattedVolume && volumeSeriesRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          volumeSeriesRef.current.update(formattedVolume as any);
        }

        dataLengthRef.current = currentCount;
      } else {
        // Full data replacement
        const formattedData = formatCandleDataForChart(candleData);

        if (formattedData.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          seriesRef.current.setData(formattedData as any);
          dataLengthRef.current = formattedData.length;

          // Update volume data
          if (volumeSeriesRef.current) {
            const volumeData = formatVolumeDataForChart(
              candleData,
              volumeUpColor,
              volumeDownColor,
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            volumeSeriesRef.current.setData(volumeData as any);
          }

          // Apply default zoom
          const visibleCandles = Math.min(
            ZOOM_CONFIG.DEFAULT_CANDLES,
            formattedData.length,
          );
          const dataLength = formattedData.length;
          const from = Math.max(0, dataLength - visibleCandles);
          const to = dataLength - 1 + 2; // +2 for right padding

          chartRef.current.timeScale().setVisibleLogicalRange({ from, to });

          // Handle period change: scroll to real time and notify parent.
          // Also scroll on symbol/interval switch so the new market renders
          // at the live edge instead of whatever offset the prior series had.
          if (periodChanged) {
            chartRef.current.timeScale().scrollToRealTime();
            onPeriodDataRequest?.(selectedPeriod);
          } else if (seriesIdentityChanged) {
            chartRef.current.timeScale().scrollToRealTime();
          }
        }
      }

      // Update tracking refs
      prevCandleCountRef.current = currentCount;
      prevLastCandleTimeRef.current = currentLastTime;
      prevSymbolRef.current = candleData.symbol;
      prevIntervalRef.current = candleData.interval;

      // Clear flag after chart has applied updates (library may emit crosshair on next frame)
      const timeoutId = setTimeout(() => {
        isApplyingDataUpdateRef.current = false;
      }, 0);

      return () => clearTimeout(timeoutId);
    }, [
      candleData,
      selectedPeriod,
      onPeriodDataRequest,
      volumeUpColor,
      volumeDownColor,
    ]);

    // Update y-axis price format when the asset's price range changes.
    // This keeps decimal precision in sync with the header price display
    // without recreating the chart series.
    useEffect(() => {
      if (!seriesRef.current || !currentPrice || currentPrice <= 0) {
        return;
      }
      const { precision, minMove } = getPriceFormatForPrice(currentPrice);
      seriesRef.current.applyOptions({
        priceFormat: { type: 'price', precision, minMove },
      });
    }, [currentPrice]);

    // Manage price lines (TP, Entry, SL, etc.)
    useEffect(() => {
      if (!seriesRef.current) {
        return;
      }

      const series = seriesRef.current;

      // Remove previously created price lines
      for (const line of activePriceLinesRef.current) {
        try {
          series.removePriceLine(line);
        } catch {
          // Line may already have been removed if series was recreated
        }
      }
      activePriceLinesRef.current = [];

      // Create new price lines
      if (priceLines && priceLines.length > 0) {
        for (const pl of priceLines) {
          const line = series.createPriceLine({
            price: pl.price,
            color: pl.color,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            lineWidth: (pl.lineWidth ?? 1) as any,
            lineStyle: pl.lineStyle ?? 2, // Default: dashed
            axisLabelVisible: true,
            title: pl.label,
          });
          activePriceLinesRef.current.push(line);
        }
      }
    }, [priceLines]);

    return (
      <Box
        ref={containerRef}
        className="perps-candlestick-chart"
        data-testid="perps-candlestick-chart"
        style={{
          width: '100%',
          height,
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      />
    );
  },
);

PerpsCandlestickChart.displayName = 'PerpsCandlestickChart';

export default PerpsCandlestickChart;
