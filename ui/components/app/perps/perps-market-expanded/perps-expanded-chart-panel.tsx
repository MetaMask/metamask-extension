import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, BoxFlexDirection, Skeleton } from '@metamask/design-system-react';
import { getPreferences } from '../../../../../shared/lib/selectors/preferences';
import { useTheme } from '../../../../hooks/useTheme';
import { usePerpsLiveCandles } from '../../../../hooks/perps/stream';
import { submitRequestToBackground } from '../../../../store/background-connection';
import {
  PerpsCandlestickChart,
  type PerpsCandlestickChartRef,
  type ChartPriceLine,
} from '../perps-candlestick-chart';
import { PerpsCandlePeriodSelector } from '../perps-candle-period-selector';
import {
  CandlePeriod,
  TimeDuration,
  ZOOM_CONFIG,
} from '../constants/chartConfig';

const CHART_THROTTLE_MS = 1000;

export type PerpsExpandedChartPanelProps = {
  /** Market symbol being charted (e.g. 'BTC'). */
  symbol: string;
};

/**
 * Chart panel for the expanded perps view.
 *
 * Owns its candle subscription (throttled to {@link CHART_THROTTLE_MS}) and
 * derives the current price from the latest candle locally. The price is never
 * lifted to the page, so a candle tick re-renders only this panel.
 */
export const PerpsExpandedChartPanel = React.memo(
  ({ symbol }: PerpsExpandedChartPanelProps) => {
    const isDark = useTheme() === 'dark';
    const { perpsSelectedCandlePeriod: persistedCandlePeriod } = useSelector(
      getPreferences,
    ) as { perpsSelectedCandlePeriod?: string };
    const resolvedPersistedPeriod =
      persistedCandlePeriod &&
      Object.values(CandlePeriod).includes(
        persistedCandlePeriod as CandlePeriod,
      )
        ? (persistedCandlePeriod as CandlePeriod)
        : CandlePeriod.FiveMinutes;
    const [localPeriodOverride, setLocalPeriodOverride] =
      useState<CandlePeriod | null>(null);
    const selectedPeriod = localPeriodOverride ?? resolvedPersistedPeriod;
    const chartRef = useRef<PerpsCandlestickChartRef>(null);

    const { candleData, isInitialLoading, fetchMoreHistory } =
      usePerpsLiveCandles({
        symbol,
        interval: selectedPeriod,
        duration: TimeDuration.YearToDate,
        throttleMs: CHART_THROTTLE_MS,
      });

    const currentPrice = useMemo(() => {
      const lastClose = candleData?.candles?.at(-1)?.close;
      return lastClose ? parseFloat(lastClose) : 0;
    }, [candleData]);

    const priceLines = useMemo<ChartPriceLine[]>(() => {
      if (currentPrice <= 0) {
        return [];
      }
      return [
        {
          price: currentPrice,
          label: '',
          // Matches the detail page's muted current-price line.
          color: isDark ? '#ffffff0a' : '#b4b4b528',
          lineStyle: 2,
          lineWidth: 2,
        },
      ];
    }, [currentPrice, isDark]);

    const handlePeriodChange = useCallback((period: CandlePeriod) => {
      setLocalPeriodOverride(period);
      submitRequestToBackground('setPreference', [
        'perpsSelectedCandlePeriod',
        period,
      ]).catch(() => {
        // best-effort; chart still updates via local state
      });
      chartRef.current?.applyZoom(ZOOM_CONFIG.DEFAULT_CANDLES, true);
    }, []);

    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="min-h-0 min-w-0 border-r border-muted"
        data-testid="perps-expanded-chart-panel"
      >
        <Box className="min-h-0 flex-1 p-2">
          {isInitialLoading && !candleData ? (
            <Skeleton className="h-full w-full rounded-lg" />
          ) : (
            <PerpsCandlestickChart
              ref={chartRef}
              height={420}
              selectedPeriod={selectedPeriod}
              candleData={candleData}
              currentPrice={currentPrice}
              priceLines={priceLines}
              onNeedMoreHistory={fetchMoreHistory}
            />
          )}
        </Box>
        <PerpsCandlePeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
        />
      </Box>
    );
  },
);

PerpsExpandedChartPanel.displayName = 'PerpsExpandedChartPanel';
