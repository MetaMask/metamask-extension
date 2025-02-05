import React, { useRef, useState } from 'react';
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
import { Hex } from '@metamask/utils';
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
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { TimeRange, useHistoricalPrices } from '../../useHistoricalPrices';
import { loadingOpacity } from '../../util';
import AssetPrice from '../asset-price';
import ChartTooltip from './chart-tooltip';
import { CrosshairPlugin } from './crosshair-plugin';

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
  aspectRatio: 2.9,
  layout: { autoPadding: false, padding: 0 },
  animation: { duration: 0 },
  fill: true,
  backgroundColor: ({ chart }) => {
    const gradient = chart.ctx.createLinearGradient(0, 0, 0, chart.height);
    gradient.addColorStop(0, `${chart.options.borderColor}60`);
    gradient.addColorStop(1, `${chart.options.borderColor}00`);
    return gradient;
  },
  elements: {
    line: { borderWidth: 2 },
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

  const [timeRange, setTimeRange] = useState<TimeRange>('1D');

  const chartRef = useRef<Chart<'line', Point[]>>();
  const priceRef = useRef<{
    setPrice: (_: { price?: number; date?: number }) => void;
  }>();

  const {
    loading,
    data: { prices, edges },
  } = useHistoricalPrices({
    chainId,
    address,
    currency,
    timeRange,
  });

  const { xMin, xMax, yMin, yMax } = edges ?? {};
  const options = {
    ...initialChartOptions,
    borderColor: theme === 'dark' ? brandColor.blue400 : brandColor.blue500,
    scales: {
      x: { min: xMin?.x, max: xMax?.x, display: false, type: 'linear' },
      y: { min: yMin?.y, max: yMax?.y, display: false },
    },
  } as const;

  if (!currentPrice || (!loading && !prices)) {
    return null;
  }

  return (
    <Box borderRadius={BorderRadius.LG}>
      <AssetPrice
        ref={priceRef}
        loading={loading}
        currency={currency}
        price={currentPrice}
        date={Date.now()}
        comparePrice={prices?.[0]?.y}
      />
      <Box
        data-testid="asset-price-chart"
        marginTop={4}
        borderRadius={BorderRadius.LG}
        backgroundColor={
          loading && !prices
            ? BackgroundColor.backgroundAlternative
            : BackgroundColor.transparent
        }
      >
        <Box style={{ opacity: loading && prices ? loadingOpacity : 1 }}>
          <ChartTooltip point={yMax} {...edges} currency={currency} />
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
          <ChartTooltip point={yMin} {...edges} currency={currency} />
        </Box>

        <Box
          style={prices ? undefined : { visibility: `hidden` }}
          display={Display.Flex}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={4}
          marginLeft={4}
          marginRight={4}
        >
          {((buttons: [string, TimeRange][]) =>
            buttons.map(([label, range]) => (
              <ButtonBase
                key={range}
                className={classnames('time-range-button', {
                  'time-range-button__selected': range === timeRange,
                })}
                onClick={() => setTimeRange(range)}
                variant={TextVariant.bodySmMedium}
                size={ButtonBaseSize.Sm}
                backgroundColor={BackgroundColor.transparent}
                color={TextColor.textAlternative}
              >
                {label}
              </ButtonBase>
            )))([
            [t('oneDayAbbreviation'), '1D'],
            [t('oneWeekAbbreviation'), '7D'],
            [t('oneMonthAbbreviation'), '1M'],
            [t('threeMonthsAbbreviation'), '3M'],
            [t('oneYearAbbreviation'), '1Y'],
            [t('all'), '1000Y'],
          ])}
        </Box>
      </Box>
    </Box>
  );
};

export default AssetChart;
