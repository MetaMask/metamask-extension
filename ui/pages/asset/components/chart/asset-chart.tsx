import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import classnames from 'clsx';
import { brandColor } from '@metamask/design-tokens';
import { Hex } from '@metamask/utils';
import { trim } from 'lodash';
import { Duration } from 'luxon';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { useTheme } from '../../../../hooks/useTheme';
import { getIsAdvancedChartsThemingEnabled } from '../../../../selectors/multichain/feature-flags';
import {
  BackgroundColor,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  ButtonBase,
  ButtonBaseSize,
} from '../../../../components/component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePrevious } from '../../../../hooks/usePrevious';
import { useHistoricalPrices } from '../../hooks/useHistoricalPrices';
import { finiteFallback, loadingOpacity } from '../../util';
import ChartTooltip from './chart-tooltip';
import { CrosshairPlugin } from './crosshair-plugin';
import { AssetChartEmptyState } from './asset-chart-empty-state';
import AssetChartPrice from './asset-chart-price';
import { getAmbientColor } from './chart-theme-config';

Chart.register(
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Decimation,
  CrosshairPlugin,
);

/**
 * Radius for the end-point dot (live indicator).
 * Only the last data point is visible; others have radius 0.
 */
const ENDPOINT_DOT_RADIUS = 5;

const initialChartOptions: ChartOptions<'line'> & { fill: boolean } = {
  normalized: true,
  parsing: false,
  aspectRatio: 2.6,
  // Padding ensures the end-point dot has room to render fully at edges
  layout: {
    autoPadding: false,
    padding: {
      top: ENDPOINT_DOT_RADIUS + 2,
      right: ENDPOINT_DOT_RADIUS + 4,
      bottom: ENDPOINT_DOT_RADIUS + 2,
      left: 0,
    },
  },
  animation: { duration: 0 },
  fill: true,
  backgroundColor: ({ chart }) => {
    const gradient = chart.ctx.createLinearGradient(0, 0, 0, chart.height);
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    gradient.addColorStop(0, `${chart.options.borderColor}60`);
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    gradient.addColorStop(1, `${chart.options.borderColor}00`);
    return gradient;
  },
  elements: {
    line: { borderWidth: 1.5 },
    point: {
      // Show a dot only on the last data point (live indicator)
      radius: (ctx) =>
        ctx.dataIndex === ctx.dataset.data.length - 1 ? ENDPOINT_DOT_RADIUS : 0,
      backgroundColor: (ctx) => ctx.chart.options.borderColor as string,
      borderWidth: 0,
    },
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

/**
 * Returns a translated time range label for a given ISO 8601 duration string.
 * The passed duration is normalized and rescaled to get the cleanest, most human-friendly representation.
 *
 * Any passed duration string that is 10 years or greater will be translated to "All".
 *
 * [Normalized](https://moment.github.io/luxon/api-docs/index.html#durationnormalize).
 * It's reduced to its canonical representation in its current units, for instance:
 * - "P2YT5000D" (2 years and 5000 days) becomes "P15YT255D" (15 years and 255 days)
 * - "PT12H-45M" (12 hours and -45 minutes) becomes "P1DT11H15M" (11 hours and 15 minutes)
 *
 * [Rescaled](https://moment.github.io/luxon/api-docs/index.html#durationrescale)
 * Converts to the largest possible unit, for instance:
 * - "PT9000S" (9000 seconds) becomes "P2H30M" (2 hours and 30 minutes)
 *
 * @param translator - A function that translates a key to a string.
 * @param iso8601Duration - The ISO 8601 duration string, e.g. "P1D", "P1M", "P1Y", "P3YT45S", ...
 * @returns The translated time range label, e.g. if locale is 'en': "1D", "1M", "1Y", "3Y 45S", ...
 */
const getTranslatedTimeRangeLabel = (
  translator: (key: string) => string,
  iso8601Duration: string,
) => {
  const { years, months, weeks, days, hours, minutes, seconds, milliseconds } =
    Duration.fromISO(iso8601Duration, { locale: 'en' })
      .normalize()
      .rescale()
      .toObject();

  if (years && years >= 10) {
    return `${translator('all')}`;
  }

  return trim(
    `${years ? `${years}${translator('durationSuffixYear')} ` : ''}${
      months ? `${months}${translator('durationSuffixMonth')} ` : ''
    }${weeks ? `${weeks}${translator('durationSuffixWeek')} ` : ''}${
      days ? `${days}${translator('durationSuffixDay')} ` : ''
    }${hours ? `${hours}${translator('durationSuffixHour')} ` : ''}${
      minutes ? `${minutes}${translator('durationSuffixMinute')} ` : ''
    }${seconds ? `${seconds}${translator('durationSuffixSecond')} ` : ''}${
      milliseconds
        ? `${milliseconds}${translator('durationSuffixMillisecond')}`
        : ''
    }`,
  );
};

const TIME_RANGES = ['P1D', 'P1W', 'P1M', 'P3M', 'P1Y', 'P10Y'];

// A chart showing historic prices for a native or token asset
const AssetChart = ({
  chainId,
  address,
  currentPrice,
  currency,
}: {
  chainId: Hex;
  address: string;
  currentPrice?: number;
  currency: string;
}) => {
  const t = useI18nContext();
  const theme = useTheme();
  const isThemingEnabled = useSelector(getIsAdvancedChartsThemingEnabled);

  const [selectedTimeRange, setSelectedTimeRange] = useState<string>(
    TIME_RANGES[0],
  );

  const {
    loading,
    isFetching,
    isPlaceholderData,
    data: {
      prices,
      metadata: { minPricePoint, maxPricePoint, xMin, xMax, yMin, yMax },
    },
  } = useHistoricalPrices({
    chainId,
    address,
    currency,
    timeRange: selectedTimeRange,
  });

  const prevIsPlaceholderData = usePrevious(isPlaceholderData);
  const wasPlaceholderData = prevIsPlaceholderData && !isPlaceholderData;

  // The cases below are not mutually exclusive
  const shouldShowChartEmptyState = !loading && prices.length === 0; // When the chart is not loading anymore and there are no prices, show an empty state
  const shouldShowChartMuted =
    isFetching && prices.length > 0 && !isPlaceholderData;

  // Determine price direction for ambient chart theming (when feature flag enabled)
  const isDark = theme === 'dark';
  const chartColor = useMemo(() => {
    if (!isThemingEnabled) {
      return undefined; // Feature flag disabled, use default blue
    }
    // Compare current price with the first price in the range to determine direction
    const comparePrice = prices?.[0]?.y;
    if (comparePrice === undefined || currentPrice === undefined) {
      return undefined; // No data yet, will use fallback
    }
    const isPositive = currentPrice >= comparePrice;
    return getAmbientColor(isPositive, isDark);
  }, [isThemingEnabled, currentPrice, prices, isDark]);

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

  const options = {
    ...initialChartOptions,
    // Use ambient color based on price direction; fallback to blue if no data yet
    borderColor:
      chartColor ?? (isDark ? brandColor.blue400 : brandColor.blue500),
    transitions: {
      active: { animation },
      default: { animation },
      resize: { animation: { duration: 0 } },
    },
    scales: {
      x: {
        min: finiteFallback(xMin, undefined),
        max: finiteFallback(xMax, undefined),
        display: false,
        type: 'linear',
      },
      y: {
        min: isPlaceholderData ? 0 : finiteFallback(yMin, 0),
        max: isPlaceholderData ? 1 : finiteFallback(yMax, 1),
        display: false,
      },
    },
  } as ChartOptions<'line'>;

  const chartRef = useRef<Chart<'line', Point[]>>();
  const priceRef = useRef<{
    setPrice: (_: { price?: number; date?: number }) => void;
  }>();

  // Init the price ref with the current price
  useEffect(() => {
    priceRef?.current?.setPrice({
      price: currentPrice,
      date: Date.now(),
    });
  }, [currentPrice]);

  return (
    <Box className="flex rounded-lg" flexDirection={BoxFlexDirection.Column}>
      <AssetChartPrice
        ref={priceRef}
        loading={loading || isPlaceholderData}
        currency={currency}
        price={currentPrice}
        date={prices?.[prices.length - 1]?.x ?? 0}
        comparePrice={
          isPlaceholderData || shouldShowChartEmptyState
            ? undefined
            : prices?.[0]?.y
        }
        ambientColor={chartColor}
      />

      <Box
        data-testid="asset-price-chart"
        className="flex rounded-lg"
        style={{ overflow: 'visible' }}
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
              style={{
                aspectRatio: `${options.aspectRatio}`,
                overflow: 'visible',
              }}
              className="flex"
              flexDirection={BoxFlexDirection.Column}
              justifyContent={
                currentPrice ? BoxJustifyContent.End : BoxJustifyContent.Start
              }
            >
              <Line
                ref={chartRef}
                data={{ datasets: [{ data: prices, clip: false }] }}
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
                      priceRef?.current?.setPrice({
                        price: point.y,
                        date: point.x,
                      });
                    }
                  }
                }}
                // Revert to current price when not hovering
                onMouseOut={() => {
                  priceRef?.current?.setPrice({
                    price: currentPrice,
                    date: Date.now(),
                  });
                }}
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

        <Box
          style={prices ? undefined : { visibility: `hidden` }}
          className="flex"
          justifyContent={BoxJustifyContent.Between}
          marginTop={2}
          marginLeft={3}
          marginRight={3}
        >
          {TIME_RANGES.map((timeRange) => (
            <ButtonBase
              key={timeRange}
              className={classnames('time-range-button', {
                'time-range-button__selected': timeRange === selectedTimeRange,
              })}
              onClick={() => setSelectedTimeRange(timeRange)}
              variant={TextVariant.bodyXsMedium}
              size={ButtonBaseSize.Sm}
              paddingLeft={2}
              paddingRight={2}
              backgroundColor={BackgroundColor.transparent}
              color={TextColor.textAlternative}
            >
              {getTranslatedTimeRangeLabel(
                t as (key: string) => string,
                timeRange,
              )}
            </ButtonBase>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default AssetChart;
