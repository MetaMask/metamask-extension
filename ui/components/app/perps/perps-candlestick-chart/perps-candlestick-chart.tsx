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
import { brandColor } from '@metamask/design-tokens';
import { Box } from '@metamask/design-system-react';
import { CandlePeriod, ZOOM_CONFIG } from '../constants/chartConfig';
import {
  formatCandleDataForChart,
  formatVolumeDataForChart,
  formatSingleCandleForChart,
  formatSingleVolumeForChart,
} from './chart-utils';
import type { CandleData, CandleStick } from '@metamask/perps-controller';

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
      priceLines,
      onPeriodDataRequest,
      onNeedMoreHistory,
      onCrosshairMove,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const dataLengthRef = useRef<number>(0);
    const previousPeriodRef = useRef<CandlePeriod>(selectedPeriod);

    // Track previous candle data for incremental update optimization
    const prevCandleCountRef = useRef<number>(0);
    const prevLastCandleTimeRef = useRef<number>(0);

    // Edge detection cooldown
    const lastLoadMoreTimeRef = useRef<number>(0);

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
          textColor: 'rgba(255, 255, 255, 0.4)',
          attributionLogo: false,
          panes: {
            separatorColor: 'transparent',
            separatorHoverColor: 'transparent',
            enableResize: false,
          },
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.06)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.06)' },
        },
        crosshair: {
          mode: 1, // Normal crosshair mode
          vertLine: {
            visible: true,
            labelVisible: true,
            width: 1,
            style: 3, // Dotted line
            color: 'rgba(255, 255, 255, 0.4)',
          },
          horzLine: {
            visible: true,
            labelVisible: true,
            width: 1,
            style: 3,
            color: 'rgba(255, 255, 255, 0.4)',
          },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: 'transparent',
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
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: brandColor.lime100,
        downColor: brandColor.red300,
        borderVisible: false,
        wickUpColor: brandColor.lime100,
        wickDownColor: brandColor.red300,
        priceLineVisible: false,
        lastValueVisible: false,
      });

      seriesRef.current = candlestickSeries;

      // Create volume histogram series (pane 1 - bottom)
      const volumeSeries = chart.addSeries(
        HistogramSeries,
        {
          color: brandColor.lime100, // Default green
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
        if (!onCrosshairMoveRef.current) {
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

      // Cleanup on unmount
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          seriesRef.current = null;
          volumeSeriesRef.current = null;
        }
      };
    }, [height, handleResize]);

    // Update chart data when candleData or selectedPeriod changes
    useEffect(() => {
      if (!seriesRef.current || !chartRef.current || !candleData) {
        return;
      }

      const { candles } = candleData;
      const currentCount = candles.length;
      const currentLastTime =
        currentCount > 0 ? candles[currentCount - 1].time : 0;

      const prevCount = prevCandleCountRef.current;
      const prevLastTime = prevLastCandleTimeRef.current;

      // Check if period changed (requires full data replacement)
      const periodChanged = previousPeriodRef.current !== selectedPeriod;
      previousPeriodRef.current = selectedPeriod;

      // Determine update strategy:
      // 1. Same count + same last candle time = live tick update (replace last candle in-place)
      // 2. Count increased by 1 + previous last time still present = new candle appended
      // 3. Otherwise = full replacement (period change, initial load, fetch-more merge)
      const isLiveTick =
        !periodChanged &&
        prevCount > 0 &&
        currentCount === prevCount &&
        currentLastTime === prevLastTime;

      const isAppend =
        !periodChanged && prevCount > 0 && currentCount === prevCount + 1;

      if (isLiveTick || isAppend) {
        // Incremental update — only update the last candle
        const lastCandle = candles[currentCount - 1];
        const formattedCandle = formatSingleCandleForChart(lastCandle);
        const formattedVolume = formatSingleVolumeForChart(lastCandle);

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
            const volumeData = formatVolumeDataForChart(candleData);
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

          // Handle period change: scroll to real time and notify parent
          if (periodChanged) {
            chartRef.current.timeScale().scrollToRealTime();
            onPeriodDataRequest?.(selectedPeriod);
          }
        }
      }

      // Update tracking refs
      prevCandleCountRef.current = currentCount;
      prevLastCandleTimeRef.current = currentLastTime;
    }, [candleData, selectedPeriod, onPeriodDataRequest]);

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
