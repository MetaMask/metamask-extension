import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { Skeleton } from '../../../component-library/skeleton';
import { useTheme } from '../../../../hooks/useTheme';
import { usePerpsLiveCandles } from '../../../../hooks/perps/stream';
import { submitRequestToBackground } from '../../../../store/background-connection';
import {
  PerpsCandlestickChart,
  type PerpsCandlestickChartRef,
} from '../perps-candlestick-chart';
import { PerpsCandlePeriodSelector } from '../perps-candle-period-selector';
import {
  CandlePeriod,
  TimeDuration,
  ZOOM_CONFIG,
} from '../constants/chartConfig';
import type { Position } from '../types';
import { buildExpandedChartPriceLines, getChartCurrentPrice } from './utils';

export type PerpsMarketExpandedChartPanelProps = {
  symbol: string;
  marketPrice: number;
  positions: Position[];
  onCurrentPriceChange: (currentPrice: number) => void;
};

export const PerpsMarketExpandedChartPanel: React.FC<
  PerpsMarketExpandedChartPanelProps
> = ({ symbol, marketPrice, positions, onCurrentPriceChange }) => {
  const theme = useTheme();
  const isDark = theme === 'dark';
  const chartRef = useRef<PerpsCandlestickChartRef>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = useState(480);
  const [selectedPeriod, setSelectedPeriod] = useState(
    CandlePeriod.FiveMinutes,
  );
  const {
    candleData,
    isInitialLoading: isLoading,
    fetchMoreHistory,
  } = usePerpsLiveCandles({
    symbol,
    interval: selectedPeriod,
    duration: TimeDuration.YearToDate,
    throttleMs: 1000,
  });

  const chartCurrentPrice = useMemo(
    () => getChartCurrentPrice(candleData),
    [candleData],
  );
  const currentPrice = chartCurrentPrice > 0 ? chartCurrentPrice : marketPrice;
  const priceLines = useMemo(
    () =>
      buildExpandedChartPriceLines({
        currentPrice: chartCurrentPrice,
        decodedSymbol: symbol,
        isDark,
        positions,
      }),
    [chartCurrentPrice, isDark, positions, symbol],
  );

  useEffect(() => {
    onCurrentPriceChange(currentPrice);
  }, [currentPrice, onCurrentPriceChange]);

  useEffect(() => {
    const chartArea = chartAreaRef.current;
    if (!chartArea || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const available = Math.floor(entry.contentRect.height);
      if (available > 120) {
        setChartHeight(available);
      }
    });

    observer.observe(chartArea);
    return () => observer.disconnect();
  }, []);

  const handlePeriodChange = useCallback((period: CandlePeriod) => {
    setSelectedPeriod(period);
    submitRequestToBackground('setPreference', [
      'perpsSelectedCandlePeriod',
      period,
    ]).catch(() => undefined);
    chartRef.current?.applyZoom(ZOOM_CONFIG.DEFAULT_CANDLES, true);
  }, []);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="min-h-0 overflow-hidden border-r border-border-muted max-[980px]:min-h-[520px]"
      data-testid="perps-expanded-chart-panel"
    >
      <Box
        ref={chartAreaRef}
        className="min-h-0 flex-1 overflow-hidden px-3 pt-3"
        data-testid="perps-expanded-chart-area"
      >
        {isLoading ? (
          <Skeleton
            className="h-full w-full rounded-lg"
            data-testid="perps-expanded-chart-skeleton"
          />
        ) : (
          <PerpsCandlestickChart
            ref={chartRef}
            height={chartHeight}
            selectedPeriod={selectedPeriod}
            candleData={candleData}
            currentPrice={currentPrice}
            priceLines={priceLines}
            onNeedMoreHistory={fetchMoreHistory}
          />
        )}
      </Box>
      <Box className="shrink-0 px-3 pb-3 pt-2">
        <PerpsCandlePeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
        />
      </Box>
    </Box>
  );
};
