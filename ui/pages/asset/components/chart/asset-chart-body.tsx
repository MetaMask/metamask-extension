import React, { ReactNode, useMemo, useRef } from 'react';
import {
  Chart,
  LineElement,
  LinearScale,
  PointElement,
  Filler,
  ChartOptions,
  Decimation,
  Point,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { usePrevious } from '../../../../hooks/usePrevious';
import type { HistoricalPrices } from '../../hooks/useHistoricalPrices';
import { finiteFallback, loadingOpacity } from '../../util';
import ChartTooltip from './chart-tooltip';
import { CrosshairPlugin } from './crosshair-plugin';
import { AssetChartEmptyState } from './asset-chart-empty-state';

Chart.register(
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Decimation,
  CrosshairPlugin,
);

const initialChartOptions: ChartOptions<'line'> = {
  normalized: true,
  parsing: false,
  aspectRatio: 2.6,
  layout: { autoPadding: false, padding: 0 },
  animation: { duration: 0 },
  elements: {
    line: { borderWidth: 1.5 },
    point: { pointStyle: false },
  },
  plugins: {
    // Downsample to a maximum number of points
    decimation: {
      algorithm: 'lttb',
      samples: 150,
      threshold: 150,
      enabled: true,
    },
  },
};

/** A point the pointer is resting on, or null once the pointer leaves. */
export type HoveredPoint = { price?: number; date?: number };

export type AssetChartBodyProps = {
  /** The price data points to plot. */
  prices: Point[];
  /** Metadata derived from `prices`, used for the chart bounds and tooltips. */
  metadata: HistoricalPrices['metadata'];
  /** Whether the prices are loading for the first time. */
  loading: boolean;
  /** Whether a price request is in flight, including background refetches. */
  isFetching: boolean;
  /** Whether `prices` is react-query placeholder data rather than real prices. */
  isPlaceholderData: boolean;
  /** The user's display currency, used to format the tooltips. */
  currency: string;
  /** The asset's current price, reverted to when the pointer leaves the chart. */
  currentPrice?: number;
  /**
   * Live price from the OHLCV stream. When set, the final plotted point tracks
   * it so the line keeps moving between historical refetches.
   */
  realtimePrice?: number;
  /** Timestamp of `realtimePrice`, in milliseconds since epoch. */
  realtimeTimestamp?: number;
  /** Called with the hovered data point, and with null once the pointer leaves. */
  onHoverPrice?: (point: HoveredPoint | null) => void;
  /** Rendered below the chart, inside the box that carries the loading treatment. */
  children?: ReactNode;
};

/**
 * Renders a line chart for a series of prices.
 *
 * This component fetches nothing and owns no time range: it plots whatever
 * prices it is given, and reports hovered points through `onHoverPrice` so the
 * caller can drive its own price header.
 */
export const AssetChartBody = ({
  prices,
  metadata: { minPricePoint, maxPricePoint, xMin, xMax, yMin, yMax },
  loading,
  isFetching,
  isPlaceholderData,
  currency,
  currentPrice,
  realtimePrice,
  realtimeTimestamp,
  onHoverPrice,
  children,
}: AssetChartBodyProps) => {
  const prevIsPlaceholderData = usePrevious(isPlaceholderData);
  const wasPlaceholderData = prevIsPlaceholderData && !isPlaceholderData;

  // The cases below are not mutually exclusive
  const shouldShowChartEmptyState = !loading && prices.length === 0; // When the chart is not loading anymore and there are no prices, show an empty state
  const shouldShowChartMuted =
    isFetching && prices.length > 0 && !isPlaceholderData;

  const animation =
    isPlaceholderData || wasPlaceholderData
      ? {
          x: false,
          y: {
            from: (ctx: { chart: { scales: { y: { bottom: number } } } }) =>
              ctx.chart.scales.y.bottom,
            duration: 400,
          },
        }
      : {
          x: { type: 'number', duration: 400 },
          y: { type: 'number', duration: 400 },
        };

  // The live price replaces the final historical point, so the line keeps
  // moving between refetches rather than ending at the last fetched sample.
  const plottedPrices = useMemo(() => {
    if (!realtimePrice || !realtimeTimestamp || prices.length === 0) {
      return prices;
    }
    // The live bar's timestamp is its candle bucket's start, which for a
    // coarse interval (e.g. 1D) can sit hours behind the newest historical
    // sample. Never move the final point backwards in time, or the closing
    // segment draws back across the chart. Keep it pinned to the newest x and
    // just refresh the price.
    const lastX = prices[prices.length - 1].x;
    const liveX = Math.max(realtimeTimestamp, lastX);
    const updated = [...prices];
    updated[updated.length - 1] = { x: liveX, y: realtimePrice };
    return updated;
  }, [prices, realtimePrice, realtimeTimestamp]);

  // The live point can sit outside the historical bounds, which would clip it.
  const adjustedXMax =
    realtimeTimestamp && Number.isFinite(xMax)
      ? Math.max(xMax, realtimeTimestamp)
      : xMax;
  const adjustedYMin =
    realtimePrice && Number.isFinite(yMin)
      ? Math.min(yMin, realtimePrice)
      : yMin;
  const adjustedYMax =
    realtimePrice && Number.isFinite(yMax)
      ? Math.max(yMax, realtimePrice)
      : yMax;

  const options = {
    ...initialChartOptions,
    borderColor: ({ chart }) =>
      getComputedStyle(chart.canvas)
        .getPropertyValue('--color-success-default')
        .trim(),
    transitions: {
      active: { animation },
      default: { animation },
      resize: { animation: { duration: 0 } },
    },
    scales: {
      x: {
        min: finiteFallback(xMin, undefined),
        max: finiteFallback(adjustedXMax, undefined),
        display: false,
        type: 'linear',
      },
      y: {
        min: isPlaceholderData ? 0 : finiteFallback(adjustedYMin, 0),
        max: isPlaceholderData ? 1 : finiteFallback(adjustedYMax, 1),
        display: false,
      },
    },
  } as ChartOptions<'line'>;

  const chartRef = useRef<Chart<'line', Point[]>>();

  return (
    <Box
      data-testid="asset-price-chart"
      className="flex rounded-lg"
      marginTop={4}
      backgroundColor={
        loading && !prices
          ? BoxBackgroundColor.BackgroundSection
          : BoxBackgroundColor.Transparent
      }
      flexDirection={BoxFlexDirection.Column}
    >
      {shouldShowChartEmptyState && <AssetChartEmptyState />}
      {!shouldShowChartEmptyState && (
        <Box style={{ opacity: shouldShowChartMuted ? loadingOpacity : 1 }}>
          <ChartTooltip
            point={isPlaceholderData ? undefined : maxPricePoint}
            xMin={xMin}
            xMax={xMax}
            currency={currency}
          />
          <Box
            style={{ aspectRatio: `${options.aspectRatio}` }}
            className="flex"
            flexDirection={BoxFlexDirection.Column}
            justifyContent={
              currentPrice ? BoxJustifyContent.End : BoxJustifyContent.Start
            }
          >
            <Line
              ref={chartRef}
              data={{ datasets: [{ data: plottedPrices, fill: false }] }}
              options={options}
              // Update the price display on chart hover
              onMouseMove={(event) => {
                if (isPlaceholderData) {
                  return;
                }
                const data = chartRef?.current?.data?.datasets?.[0]?.data;
                if (data) {
                  const target = event.target as HTMLElement;
                  const index = Math.max(
                    0,
                    Math.min(
                      data.length - 1,
                      Math.round(
                        (event.nativeEvent.offsetX / target.clientWidth) *
                          data.length,
                      ),
                    ),
                  );
                  const point = data[index];
                  if (point) {
                    onHoverPrice?.({
                      price: point.y,
                      date: point.x,
                    });
                  }
                }
              }}
              // Signal that nothing is hovered; what to show instead is the
              // caller's decision, since it may have a fresher price than
              // the one we were handed.
              onMouseOut={() => onHoverPrice?.(null)}
            />
          </Box>

          <ChartTooltip
            point={isPlaceholderData ? undefined : minPricePoint}
            xMin={xMin}
            xMax={xMax}
            currency={currency}
          />
        </Box>
      )}

      {children}
    </Box>
  );
};
