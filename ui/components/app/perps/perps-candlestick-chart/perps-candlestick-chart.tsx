import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { createChart, IChartApi, CandlestickSeries, ISeriesApi } from 'lightweight-charts';
import { mockCandleData, formatCandleDataForChart, CandleData } from './mock-candle-data';
import { CandlePeriod, ZOOM_CONFIG, getVisibleRange } from '../constants/chartConfig';

interface PerpsCandlestickChartProps {
  /** Height of the chart in pixels */
  height?: number;
  /** Selected candle period */
  selectedPeriod?: CandlePeriod;
  /** Candle data to display (uses mock data if not provided) */
  candleData?: CandleData;
  /** Callback when data needs to be fetched for a new period */
  onPeriodDataRequest?: (period: CandlePeriod) => void;
}

export interface PerpsCandlestickChartRef {
  /** Apply zoom to show a specific number of candles */
  applyZoom: (candleCount: number, forceReset?: boolean) => void;
  /** Scroll to the most recent candles */
  scrollToRealTime: () => void;
  /** Get current chart instance */
  getChart: () => IChartApi | null;
}

/**
 * PerpsCandlestickChart component
 * Displays a candlestick chart using TradingView's Lightweight Charts library
 *
 * ATTRIBUTION NOTICE:
 * TradingView Lightweight Charts™
 * Copyright (c) 2025 TradingView, Inc. https://www.tradingview.com/
 */
const PerpsCandlestickChart = forwardRef<PerpsCandlestickChartRef, PerpsCandlestickChartProps>(
  (
    {
      height = 250,
      selectedPeriod = CandlePeriod.FIVE_MINUTES,
      candleData,
      onPeriodDataRequest,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
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

    // Apply zoom to show specific number of candles
    const applyZoom = useCallback((candleCount: number, forceReset = false) => {
      if (!chartRef.current || dataLengthRef.current === 0) {
        return;
      }

      const range = getVisibleRange(dataLengthRef.current, candleCount);
      chartRef.current.timeScale().setVisibleLogicalRange(range);

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

      // Create candlestick series
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#BAF24A',
        downColor: '#FF7584',
        borderVisible: false,
        wickUpColor: '#BAF24A',
        wickDownColor: '#FF7584',
        priceLineVisible: false,
        lastValueVisible: false,
      });

      seriesRef.current = candlestickSeries;

      // Add resize listener
      window.addEventListener('resize', handleResize);

      // Cleanup on unmount
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          seriesRef.current = null;
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
        seriesRef.current.setData(formattedData);
        dataLengthRef.current = formattedData.length;

        // Check if period changed
        const periodChanged = previousPeriodRef.current !== selectedPeriod;
        previousPeriodRef.current = selectedPeriod;

        // Apply default zoom when period changes or on initial load
        const visibleCandles = Math.min(ZOOM_CONFIG.DEFAULT_CANDLES, formattedData.length);
        const range = getVisibleRange(formattedData.length, visibleCandles);

        chartRef.current.timeScale().setVisibleLogicalRange(range);

        // Scroll to real time when period changes
        if (periodChanged) {
          chartRef.current.timeScale().scrollToRealTime();
        }
      }
    }, [candleData, selectedPeriod]);

    // Request data when period changes
    useEffect(() => {
      if (onPeriodDataRequest && selectedPeriod !== previousPeriodRef.current) {
        onPeriodDataRequest(selectedPeriod);
      }
    }, [selectedPeriod, onPeriodDataRequest]);

    return (
      <div
        ref={containerRef}
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
