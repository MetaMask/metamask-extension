import React, { useEffect, MouseEvent, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Chart,
  LineElement,
  LinearScale,
  PointElement,
  Filler,
  ChartData,
  ChartOptions,
  Decimation,
  Point,
  ChartEvent,
} from 'chart.js';
// import CrosshairPlugin from 'chartjs-plugin-crosshair';
import { Line } from 'react-chartjs-2';
import classnames from 'classnames';
import { getCurrentChainId, getCurrentCurrency } from '../../../selectors';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import {
  Box,
  ButtonSecondary,
  ButtonSecondarySize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import { MINUTE } from '../../../../shared/constants/time';
import AssetPrice from './asset-price';
import ChartTooltip from './chart-tooltip';

/** Time range units supported by the price API */
type TimeRange = `${number}D` | `${number}M` | `${number}Y`;

/** A Chart.js plugin that draws a vertical crosshair on hover */
const crosshairPlugin = {
  id: 'crosshair',
  afterEvent(chart: Chart, { event }: { event: ChartEvent }) {
    chart.crosshairX = event.type === 'mouseout' ? undefined : event.x;
    chart.draw();
  },
  afterDraw(chart: Chart) {
    if (chart.crosshairX !== undefined) {
      const { y } = chart.scales;
      chart.ctx.beginPath();
      chart.ctx.moveTo(chart.crosshairX, y.getPixelForValue(y.max));
      chart.ctx.lineWidth = 2;
      chart.ctx.strokeStyle = '#BBC0C5';
      chart.ctx.lineTo(chart.crosshairX, y.getPixelForValue(y.min));
      chart.ctx.stroke();
    }
  },
};

Chart.register(
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Decimation,
  crosshairPlugin,
);

const initialChartOptions: ChartOptions<'line'> = {
  normalized: true,
  parsing: false,
  aspectRatio: 2.3,
  layout: { autoPadding: false, padding: 0 },
  animation: { duration: 0 },
  fill: true,
  borderColor: '#0376c9',
  backgroundColor: ({ chart }: { chart: Chart }) => {
    const gradient = chart.ctx.createLinearGradient(0, 0, 0, chart.height);
    gradient.addColorStop(0, '#0376c94C');
    gradient.addColorStop(1, '#D9D9D900');
    return gradient;
  },
  elements: {
    line: { borderWidth: 2 },
    point: { pointStyle: false },
  },
  plugins: {
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
  address,
  currentPrice,
}: {
  address: string;
  currentPrice: number;
}) => {
  const t = useI18nContext();
  const chainId = hexToDecimal(useSelector(getCurrentChainId));
  const currency = useSelector(getCurrentCurrency);

  const [data, setData] = useState<ChartData<'line', Point[]>>();
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('1D');
  const [chartOptions, setChartOptions] = useState(initialChartOptions);

  const chartRef = useRef<Chart<'line', Point[]>>();
  const priceRef = useRef<{
    setPrices: (_: {
      price?: number;
      comparePrice?: number;
      date?: number;
    }) => void;
  }>();
  const maxPriceTooltip = useRef<{
    setTooltip: (_: { xAxisPercent: number; price: number }) => void;
  }>();
  const minPriceTooltip = useRef<{
    setTooltip: (_: { xAxisPercent: number; price: number }) => void;
  }>();

  useEffect(() => {
    setLoading(true);

    // TODO: Consider exposing HTTP request through a controller
    fetchWithCache({
      url: `https://price-api.metafi-dev.codefi.network/v1/chains/${chainId}/historical-prices/${address}?vsCurrency=${currency}&timePeriod=${timeRange}`,
      cacheOptions: { cacheRefreshTime: MINUTE }, // todo minute
      functionName: 'GetAssetHistoricalPrices',
    })
      .catch(() => ({}))
      .then((resp) => {
        setLoading(false);

        const prices = resp?.prices?.map((p) => ({ x: p?.[0], y: p?.[1] }));
        if (!prices || prices.length === 0) {
          return;
        }

        priceRef?.current?.setPrices({
          price: undefined,
          comparePrice: prices[0].y,
          date: Date.now(),
        });

        let [xMin, xMax, yMin, yMax]: Point[] = [];
        for (const p of prices) {
          !xMin || p.x < xMin.x ? (xMin = p) : null;
          !xMax || p.x > xMax.x ? (xMax = p) : null;
          !yMin || p.y < yMin.y ? (yMin = p) : null;
          !yMax || p.y > yMax.y ? (yMax = p) : null;
        }

        const drawTooltips = () => {
          maxPriceTooltip.current?.setTooltip({
            xAxisPercent: (100 * (yMax.x - xMin.x)) / (xMax.x - xMin.x),
            price: yMax.y,
          });
          minPriceTooltip.current?.setTooltip({
            xAxisPercent: (100 * (yMin.x - xMin.x)) / (xMax.x - xMin.x),
            price: yMin.y,
          });
        };

        drawTooltips();
        setChartOptions((options) => ({
          ...options,
          onResize: () => drawTooltips(),
          scales: {
            x: { min: xMin.x, max: xMax.x, display: false, type: 'linear' },
            y: { min: yMin.y, max: yMax.y, display: false },
          },
        }));
        setData({ datasets: [{ data: prices }] });
      });
  }, [chainId, address, currency, timeRange]);

  const prices = data?.datasets?.[0]?.data;

  return (
    <Box>
      <AssetPrice
        currentPrice={currentPrice}
        loading={loading}
        ref={priceRef}
      />
      <Box style={{ opacity: prices && loading ? 0.2 : 1 }}>
        <ChartTooltip ref={maxPriceTooltip} />
        <Box
          backgroundColor={
            prices
              ? BackgroundColor.transparent
              : BackgroundColor.backgroundAlternative
          }
          style={{
            aspectRatio: `${chartOptions.aspectRatio}`,
          }}
        >
          {prices ? (
            <Line
              ref={chartRef}
              data={data}
              options={chartOptions}
              updateMode="none"
              onMouseMove={(e: MouseEvent) => {
                if (chartRef.current && e.nativeEvent) {
                  const { offsetX } = e.nativeEvent;
                  const { width } = chartRef.current;
                  const index = Math.max(
                    0,
                    Math.min(
                      prices.length - 1,
                      Math.round((offsetX / width) * prices.length),
                    ),
                  );
                  priceRef?.current?.setPrices({
                    price: prices[index].y,
                    comparePrice: prices[0].y,
                    date: prices[index].x,
                  });
                }
              }}
              onMouseOut={() => {
                priceRef?.current?.setPrices({
                  price: undefined,
                  comparePrice: prices?.[0].y,
                  date: Date.now(),
                });
              }}
            />
          ) : loading ? (
            <Box backgroundColor={BackgroundColor.backgroundAlternative}></Box>
          ) : (
            <Box
              backgroundColor={BackgroundColor.backgroundAlternative}
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              justifyContent={JustifyContent.center}
              alignItems={AlignItems.center}
              gap={1}
              paddingTop={12}
            >
              <Icon name={IconName.Info} size={IconSize.Xl} />
              <Text>{t('noChartData')}</Text>
              <Text>{t('couldNotFetchDataForToken')}</Text>
            </Box>
          )}
        </Box>
        <ChartTooltip ref={minPriceTooltip} />
      </Box>

      {prices ? (
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.spaceEvenly}
          marginTop={4}
        >
          {((buttons: [string, TimeRange][]) =>
            buttons.map(([label, range]) => (
              <ButtonSecondary
                key={range}
                className={classnames('time-range-button', {
                  'time-range-button__selected': range === timeRange,
                })}
                onClick={() => setTimeRange(range)}
                variant={TextVariant.bodySmMedium}
                size={ButtonSecondarySize.Sm}
                borderColor={BorderColor.transparent}
                color={
                  range === timeRange
                    ? TextColor.textDefault
                    : TextColor.textAlternative
                }
              >
                {label}
              </ButtonSecondary>
            )))([
            [t('oneDayAbbreviation'), '1D'],
            [t('oneWeekAbbreviation'), '7D'],
            [t('oneMonthAbbreviation'), '1M'],
            [t('threeMonthsAbbreviation'), '3M'],
            [t('oneYearAbbreviation'), '1Y'],
            [t('all'), '1000Y'],
          ])}
        </Box>
      ) : (
        <Box padding={5}></Box>
      )}
    </Box>
  );
};

export default AssetChart;
