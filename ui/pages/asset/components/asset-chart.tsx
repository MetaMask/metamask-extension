import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'chartjs-adapter-moment';
import { useSelector } from 'react-redux';
import {
  Chart,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Filler,
  ScriptableContext,
  ChartData,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import CrosshairPlugin from 'chartjs-plugin-crosshair';
import { getCurrentChainId, getCurrentCurrency } from '../../../selectors';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  ButtonPrimary,
  ButtonPrimarySize,
  ButtonSecondary,
  ButtonSecondarySize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import fetchWithCache from '../../../../shared/lib/fetch-with-cache';
import { MINUTE } from '../../../../shared/constants/time';
import { getPricePrecision } from './util';
import { isWidthDown } from '@material-ui/core';

/** Time range units supported by the price API */
type TimeRange = `${number}D` | `${number}M` | `${number}Y`;

const chartUp = (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.75 3.8125L6.25 7.4875L4.91667 5.3875L2.25 8.1875"
      stroke="#28A745"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M8.08398 3.8125H9.75065V5.5625"
      stroke="#28A745"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);
const chartDown = (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M9.75 8.1875L6.25 4.5125L4.91667 6.6125L2.25 3.8125"
      stroke="#D73847"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M8.08398 8.1875H9.75065V6.4375"
      stroke="#D73847"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const shortDateFormatter = Intl.DateTimeFormat(navigator.language, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

Chart.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  CrosshairPlugin,
  // Fixes crosshair to be hidden on mouseout
  {
    id: 'updateOnMouseOut',
    afterEvent: (chart, args) =>
      args.event.type === 'mouseout' ? chart.update('none') : null,
  },
);

const chartOptions = {
  aspectRatio: 1.8,
  fill: true,
  layout: { autoPadding: false },
  elements: {
    line: { borderWidth: 2 },
    point: { pointStyle: false },
  },
  scales: {
    x: {
      display: false,
      type: 'time',
      grid: { display: false },
    },
    y: {
      display: false,
      grid: { display: false },
    },
  },
  plugins: {
    crosshair: {
      zoom: { enabled: false },
      line: {
        color: '#BBC0C5',
        width: 2,
      },
    },
  },
} as const;

// A chart showing historic prices for a native or token asset
const AssetChart = ({ address }: { address: string }) => {
  const t = useI18nContext();
  const chainId = hexToDecimal(useSelector(getCurrentChainId));
  const currency = useSelector(getCurrentCurrency);

  const chartRef = useRef<Chart<'line', number[], Date>>();
  const [timeRange, setTimeRange] = useState<TimeRange>('1D');
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>();
  const [data, setData] = useState<ChartData<'line', number[], Date>>();

  // TODO: consider exposing this fetch through a controller
  useEffect(() => {
    setData(undefined);
    fetchWithCache({
      url: `https://price-api.metafi-dev.codefi.network/v1/chains/${chainId}/historical-prices/${address}?vsCurrency=${currency}&timePeriod=${timeRange}`,
      cacheOptions: { cacheRefreshTime: Number(0) }, // TODO: MINUTE
      functionName: 'GetAssetHistoricalPrices',
    })
      .catch(() => ({ prices: [] }))
      .then(({ prices }) => {
        const up = prices?.[prices?.length - 1]?.[1] - prices?.[0]?.[1] >= 0;
        setData({
          labels: prices?.map((item: any) => new Date(item[0])),
          datasets: [
            {
              data: prices?.map((item: any) => item[1]),
              borderColor: '#0376c9',// () => (up ? '#28A745' : '#D73847'),
              backgroundColor: ({ chart }) => {
                const g = chart.ctx.createLinearGradient(0, 0, 0, chart.height);
                g.addColorStop(0,'#0376c94C');
                g.addColorStop(1, '#D9D9D900');
                return g;
              },
            },
          ],
        });
      });
  }, [chainId, address, currency, timeRange]);

  // Calculate what changes on hover
  const prices = data?.datasets?.[0]?.data;
  let hoveredPrice, priceDelta;
  if (prices && prices.length > 0) {
    hoveredPrice = prices[hoveredIndex ?? prices.length - 1];
    priceDelta = hoveredPrice - prices[0]; // todo??
  }

  // background --background-default-pressed ???
  const getButton = (label: string, range: TimeRange) => {
    const opts = {
      onClick: () => setTimeRange(range),
      variant: TextVariant.bodySmMedium,
      className: 'time-range-button',
    };
    return range === timeRange ? (
      <ButtonPrimary {...opts} size={ButtonPrimarySize.Sm}>
        {label}
      </ButtonPrimary>
    ) : (
      <ButtonSecondary
        {...opts}
        size={ButtonSecondarySize.Sm}
        borderColor={BorderColor.transparent}
        color={TextColor.textAlternative}
        backgroundColor={BackgroundColor.backgroundDefault}
      >
        {label}
      </ButtonSecondary>
    );
  };

  return (
    <Box>
      <Text paddingLeft={4} variant={TextVariant.headingLg}>
        {hoveredPrice
          ? formatCurrency(
              `${hoveredPrice}`,
              currency,
              getPricePrecision(hoveredPrice),
            )
          : '\u00A0'}
      </Text>
      <Box paddingLeft={4} paddingBottom={4}>
        {prices !== undefined && priceDelta && data?.labels ? (
          <>
            {priceDelta >= 0 ? chartUp : chartDown}
            <Text
              display={Display.InlineBlock}
              variant={TextVariant.bodyMdMedium}
              marginLeft={1}
              marginRight={1}
              color={
                priceDelta >= 0
                  ? TextColor.successDefault
                  : TextColor.errorDefault
              }
            >
              {formatCurrency(
                `${Math.abs(priceDelta)}`,
                currency,
                getPricePrecision(priceDelta),
              )}{' '}
              ({priceDelta >= 0 ? '+' : ''}
              {(100 * (priceDelta / prices[0])).toFixed(2)}%)
            </Text>
            <Text
              display={Display.InlineBlock}
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textAlternative}
            >
              {shortDateFormatter.format(
                data.labels[hoveredIndex ?? data.labels.length - 1],
              )}
            </Text>
          </>
        ) : (
          // Placeholder to take up same amount of room during loading
          <Text variant={TextVariant.bodyMdMedium}>{'\u00A0'}</Text>
        )}
      </Box>
      {prices && prices.length > 0 &&
        <>
          <Line
            ref={chartRef}
            data={data}
            onMouseMove={(e) => {
              chartRef.current &&
                setHoveredIndex(
                  Math.min(
                    prices.length - 1,
                    Math.round(
                      (e.nativeEvent.offsetX / chartRef.current.width) *
                        prices.length,
                    ),
                  ),
                );
            }}
            onMouseOut={() => setHoveredIndex(undefined)}
            options={chartOptions}
            updateMode="none"
          />
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceEvenly}
            marginTop={2}
          >
            {getButton(t('oneDayAbbreviation'), '1D')}
            {getButton(t('oneWeekAbbreviation'), '7D')}
            {getButton(t('oneMonthAbbreviation'), '1M')}
            {getButton(t('threeMonthsAbbreviation'), '3M')}
            {getButton(t('oneYearAbbreviation'), '1Y')}
            {getButton(t('all'), '1000Y')}
          </Box>
        </>
      }
      {
        prices === undefined &&
        <Box display={Display.Grid} width={BlockSize.Full}>
          <Box  backgroundColor={BackgroundColor.backgroundAlternative} style={{aspectRatio: `${chartOptions.aspectRatio}`}}>

          </Box>
        </Box>
        // return prices?.length === 0 ? (
        //   <Box
        //     style={{ height: `${100 / chartOptions.aspectRatio}vw` }}
        //     display={Display.Flex}
        //     flexDirection={FlexDirection.Column}
        //     alignItems={AlignItems.center}
        //     justifyContent={JustifyContent.center}
        //     gap={1}
        //     borderRadius={BorderRadius.LG}
        //     marginLeft={4}
        //     marginRight={4}
        //     backgroundColor={BackgroundColor.backgroundAlternative}
        //   >
        //     <Icon name={IconName.Info} size={IconSize.Xl} />
        //     <Text>{t('noChartData')}</Text>
        //     <Text>{t('couldNotFetchDataForToken')}</Text>
        //   </Box>
        // ) : (
        //   // TODO: using the chart but making the background a diff color while no data might work too?
        //   //
        //   // TODO: This box is a skeleton for the chart while data is fetching. It (and the box above)
        //   // should be the same height as the chart, which maintains `aspectRatio`. This skeleton
        //   // maintains the same aspect ratio, but against the viewport. This works in popup mode
        //   // but not in fullscreen mode. We really want height relative to the parent's width, not vw.
        //   <Box
        //     style={{ height: `${100 / chartOptions.aspectRatio}vw` }}
        //     borderRadius={BorderRadius.LG}
        //     marginLeft={4}
        //     marginRight={4}
        //     backgroundColor={BackgroundColor.backgroundAlternative}
        //   ></Box>
        // );
      }
    </Box>
  );
};

export default AssetChart;
