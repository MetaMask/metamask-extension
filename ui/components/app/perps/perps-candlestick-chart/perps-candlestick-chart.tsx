import React, { useEffect, useRef, useCallback } from 'react';
import { createChart, IChartApi, CandlestickSeries } from 'lightweight-charts';
import { mockCandleData, formatCandleDataForChart } from './mock-candle-data';

interface PerpsCandlestickChartProps {
  /** Height of the chart in pixels */
  height?: number;
}

/**
 * PerpsCandlestickChart component
 * Displays a candlestick chart using TradingView's Lightweight Charts library
 * Uses mock data for development
 *
 * ATTRIBUTION NOTICE:
 * TradingView Lightweight Charts™
 * Copyright (c) 2025 TradingView, Inc. https://www.tradingview.com/
 */
const PerpsCandlestickChart: React.FC<PerpsCandlestickChartProps> = ({
  height = 250,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (chartRef.current && containerRef.current) {
      chartRef.current.applyOptions({
        width: containerRef.current.clientWidth,
      });
    }
  }, []);

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

    // Load mock data
    const formattedData = formatCandleDataForChart(mockCandleData);
    if (formattedData.length > 0) {
      candlestickSeries.setData(formattedData);

      // Fit content to show all data, then zoom to last 30 candles
      const dataLength = formattedData.length;
      const visibleCandles = Math.min(30, dataLength);
      const fromIndex = Math.max(0, dataLength - visibleCandles);

      chart.timeScale().setVisibleLogicalRange({
        from: fromIndex,
        to: dataLength - 1 + 2, // +2 for right padding
      });
    }

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [height, handleResize]);

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
};

export default PerpsCandlestickChart;

