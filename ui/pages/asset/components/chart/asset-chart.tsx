import React, { useEffect, useRef, useState } from 'react';
import {
  Chart,
  LineElement,
  LinearScale,
  PointElement,
  Filler,
  ChartOptions,
  Decimation,
  Point,
  // @ts-expect-error suppress CommonJS vs ECMAScript error
} from 'chart.js';
// @ts-expect-error suppress CommonJS vs ECMAScript error
import { Line } from 'react-chartjs-2';
import classnames from 'classnames';
import { brandColor } from '@metamask/design-tokens';
import { CaipAssetType, Hex } from '@metamask/utils';
import { trim } from 'lodash';
import { Duration } from 'luxon';
import { useTheme } from '../../../../hooks/useTheme';
import {
  BackgroundColor,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
  BorderRadius,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  ButtonBase,
  ButtonBaseSize,
} from '../../../../components/component-library';
import { TokenFiatDisplayInfo } from '../../../../components/app/assets/types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useHistoricalPrices } from '../../hooks/useHistoricalPrices';
import { loadingOpacity } from '../../util';
import { useChartTimeRanges } from '../../hooks/useChartTimeRanges';
import ChartTooltip from './chart-tooltip';
import { CrosshairPlugin } from './crosshair-plugin';
import { AssetChartEmptyState } from './asset-chart-empty-state';
import { AssetChartLoading } from './asset-chart-loading';
import AssetChartPrice from './asset-chart-price';

Chart.register(
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Decimation,
  CrosshairPlugin,
);

const initialChartOptions: ChartOptions<'line'> & { fill: boolean } = {
  normalized: true,
  parsing: false,
  aspectRatio: 2.6,
  layout: { autoPadding: false, padding: 0 },
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

/**
 * Returns a translated time range label for a given ISO 8601 duration string.
 * The passed duration is normalized and rescaled to get the cleanest, most human-friendly representation.
 *
 * Any passed duration string that is greater than 100 years will be translated to "All".
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

  if (years && years > 100) {
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

// A chart showing historic prices for a native or token asset
const AssetChart = ({
  chainId,
  address,
  currentPrice,
  currency,
  asset,
}: {
  chainId: Hex;
  address: string;
  currentPrice?: number;
  currency: string;
  asset?: TokenFiatDisplayInfo;
}) => {
  const t = useI18nContext();
  const theme = useTheme();

  const timeRanges = useChartTimeRanges(address as CaipAssetType, currency);

  const [selectedTimeRange, setSelectedTimeRange] = useState<string>(
    timeRanges[0] ?? 'P1D',
  );

  const {
    loading,
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

  // The cases below are intentionally mutually exclusive, in order to flatten the render logic
  const shouldShowChartLoading = loading && prices.length === 0;
  const shouldShowChartEmptyState = !loading && prices.length === 0; // When the chart is not loading anymore and there are no prices, show an empty state
  const shouldShowChartMuted = loading && prices.length > 0;
  const shouldShowChart = !loading && prices.length > 0;

  const options = {
    ...initialChartOptions,
    borderColor: theme === 'dark' ? brandColor.blue400 : brandColor.blue500,
    scales: {
      x: { min: xMin, max: xMax, display: false, type: 'linear' },
      y: { min: yMin, max: yMax, display: false },
    },
  } as const;

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
    <Box
      borderRadius={BorderRadius.LG}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
    >
      <AssetChartPrice
        ref={priceRef}
        loading={loading}
        currency={currency}
        price={currentPrice}
        date={Date.now()}
        comparePrice={prices?.[0]?.y}
        asset={asset}
      />

      <Box
        data-testid="asset-price-chart"
        marginTop={4}
        backgroundColor={
          loading && !prices
            ? BackgroundColor.backgroundSection
            : BackgroundColor.transparent
        }
        borderRadius={BorderRadius.LG}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
      >
        {shouldShowChartLoading && <AssetChartLoading />}
        {shouldShowChartEmptyState && <AssetChartEmptyState />}
        {(shouldShowChart || shouldShowChartMuted) && (
          <Box style={{ opacity: shouldShowChartMuted ? loadingOpacity : 1 }}>
            <ChartTooltip
              point={maxPricePoint}
              xMin={xMin}
              xMax={xMax}
              currency={currency}
            />
            <Box
              style={{ aspectRatio: `${options.aspectRatio}` }}
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              justifyContent={
                currentPrice ? JustifyContent.flexEnd : JustifyContent.flexStart
              }
            >
              <Line
                ref={chartRef}
                data={{ datasets: [{ data: prices }] }}
                options={options}
                updateMode="none"
                // Update the price display on chart hover
                onMouseMove={(event) => {
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
              point={minPricePoint}
              xMin={xMin}
              xMax={xMax}
              currency={currency}
            />
          </Box>
        )}

        <Box
          style={prices ? undefined : { visibility: `hidden` }}
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={2}
          marginLeft={3}
          marginRight={3}
        >
          {timeRanges.map((timeRange) => (
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
