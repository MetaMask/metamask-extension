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
  mockCandleData,
  formatCandleDataForChart,
  formatVolumeDataForChart,
  CandleData,
} from './mock-candle-data';

type PerpsCandlestickChartProps = {
  /** Height of the chart in pixels */
  height?: number;
  /** Selected candle period */
  selectedPeriod?: CandlePeriod;
  /** Candle data to display (uses mock data if not provided) */
  candleData?: CandleData;
  /** Callback when data needs to be fetched for a new period */
  onPeriodDataRequest?: (period: CandlePeriod) => void;
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
      onPeriodDataRequest,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
    const dataLengthRef = useRef<number>(0);
    const previousPeriodRef = useRef<CandlePeriod>(selectedPeriod);

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
      if (!seriesRef.current || !chartRef.current) {
        return;
      }

      // Use provided candleData or fall back to mock data
      const dataToUse = candleData || mockCandleData;
      const formattedData = formatCandleDataForChart(dataToUse);

      if (formattedData.length > 0) {
        // Type assertion needed: mock data uses a Time branded type that is
        // structurally identical but incompatible with library's Time due to unique symbols
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        seriesRef.current.setData(formattedData as any);
        dataLengthRef.current = formattedData.length;

        // Update volume data
        if (volumeSeriesRef.current) {
          const volumeData = formatVolumeDataForChart(dataToUse);
          // Type assertion needed: mock data uses a Time branded type that is
          // structurally identical but incompatible with library's Time due to unique symbols
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          volumeSeriesRef.current.setData(volumeData as any);
        }

        // Check if period changed
        const periodChanged = previousPeriodRef.current !== selectedPeriod;
        previousPeriodRef.current = selectedPeriod;

        // Apply default zoom when period changes or on initial load
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
          // Notify parent component to fetch new data for the selected period
          onPeriodDataRequest?.(selectedPeriod);
        }
      }
    }, [candleData, selectedPeriod, onPeriodDataRequest]);

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
