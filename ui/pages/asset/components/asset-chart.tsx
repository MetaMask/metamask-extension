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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import CrosshairPlugin from 'chartjs-plugin-crosshair';
import { getCurrentChainId, getCurrentCurrency } from '../../../selectors';
import {
  AlignItems,
  BackgroundColor,
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
import { getPricePrecision } from './util';

/** Time range units supported by the price API */
type TimeRange = `${number}D` | `${number}M` | `${number}Y`;

// TODO: Make these into legit icons
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

const dateFormatter = Intl.DateTimeFormat(navigator.language, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

const chartOptions = {
  aspectRatio: 1.3,
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

  const chartRef = useRef<Chart<'line', number[], Date>>(null);
  const [prices, setPrices] = useState<any>();
  const [timeRange, setTimeRange] = useState<TimeRange>('1D');
  const [hoveredIndex, setHoveredIndex] = useState<number>(0);

  // TODO: consider exposing this fetch through a controller
  useEffect(() => {
    setHoveredIndex(0); // todo why zero?
    setPrices(undefined);
    fetch(
      // todo or use the historic-price-graph api instead?  see how they re implemented in backend
      `https://price-api.metafi-dev.codefi.network/v1/chains/${chainId}/historical-prices/${address}?vsCurrency=${currency}&timePeriod=${timeRange}`,
    )
      .then((resp) => (resp.status === 200 ? resp.json() : { prices: [] }))
      .then((data) => {
        setPrices(data.prices);
        setHoveredIndex(data.prices.length - 1);
      });
  }, [chainId, address, currency, timeRange]);

  // Calculate data that changes on hover
  let priceDelta, pricePercent;
  if (prices?.length > 0) {
    const firstPrice = prices[0][1];
    const hoveredPrice = prices[hoveredIndex][1];
    priceDelta = hoveredPrice - firstPrice;
    pricePercent = 100 * ((hoveredPrice - firstPrice) / firstPrice);
  }

  const up = priceDelta >= 0;
  const data = useMemo(
    () => ({
      labels: prices?.map((item: any) => new Date(item[0])),
      datasets: [
        {
          data: prices?.map((item: any) => item[1]),
          borderColor: up ? '#28A745' : '#D73847',
          backgroundColor: (context: ScriptableContext<'line'>) => {
            const gradient = context.chart.ctx.createLinearGradient(
              0,
              0,
              0,
              context.chart.height,
            );
            gradient.addColorStop(
              0,
              up ? 'rgba(40, 167, 69, 0.30)' : 'rgba(229, 0, 0, 0.30)',
            );
            gradient.addColorStop(1, 'rgba(217, 217, 217, 0.00)');
            return gradient;
          },
        },
      ],
    }),
    [prices, up],
  );

  // todo: can we only generate labels and datasets on time range change
  // and only change colors on `up` change?

  // background --background-default-pressed ???
  const getButton = (label: string, range: TimeRange) => {
    const opts = { onClick: () => setTimeRange(range) };
    return range === timeRange ? (
      <ButtonPrimary {...opts} size={ButtonPrimarySize.Sm}>
        {label}
      </ButtonPrimary>
    ) : (
      <ButtonSecondary
        {...opts}
        size={ButtonSecondarySize.Sm}
        borderColor={BorderColor.transparent}
      >
        {label}
      </ButtonSecondary>
    );
  };

  return (
    <Box>
      <Text paddingLeft={4} variant={TextVariant.headingLg}>
        {prices?.length > 0 &&
          formatCurrency(
            prices[hoveredIndex][1],
            currency,
            getPricePrecision(prices[hoveredIndex][1]),
          )}
      </Text>
      <Box paddingLeft={4} paddingBottom={4}>
        {priceDelta !== undefined && pricePercent !== undefined ? (
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
              {pricePercent.toFixed(2)}%)
            </Text>
            <Text
              display={Display.InlineBlock}
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textAlternative}
            >
              {dateFormatter.format(prices[hoveredIndex][0])}
            </Text>
          </>
        ) : (
          // Placeholder to take up same amount of room during loading
          <Text>{'\u00A0'}</Text>
        )}
      </Box>
      {(function () {
        if (prices?.length > 0) {
          return (
            <Line
              ref={chartRef}
              data={data}
              onMouseMove={(e) => {
                setHoveredIndex(
                  Math.min(
                    prices?.length - 1,
                    Math.round(
                      (e.nativeEvent.offsetX / chartRef.current.width) *
                        prices?.length,
                    ),
                  ),
                );
              }}
              onMouseOut={() => setHoveredIndex(prices?.length - 1)}
              options={chartOptions}
              updateMode="none"
            />
          );
        }
        return prices?.length === 0 ? (
          <Box
            style={{ height: `${100 / chartOptions.aspectRatio}vw` }}
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            gap={1}
            borderRadius={BorderRadius.LG}
            marginLeft={4}
            marginRight={4}
            backgroundColor={BackgroundColor.backgroundAlternative}
          >
            <Icon name={IconName.Info} size={IconSize.Xl} />
            <Text>{t('noChartData')}</Text>
            <Text>{t('couldNotFetchDataForToken')}</Text>
          </Box>
        ) : (
          // TODO: using the chart but making the background a diff color while no data might work too?
          //
          // TODO: This box is a skeleton for the chart while data is fetching. It (and the box above)
          // should be the same height as the chart, which maintains `aspectRatio`. This skeleton
          // maintains the same aspect ratio, but against the viewport. This works in popup mode
          // but not in fullscreen mode. We really want height relative to the parent's width, not vw.
          <Box
            style={{ height: `${100 / chartOptions.aspectRatio}vw` }}
            borderRadius={BorderRadius.LG}
            marginLeft={4}
            marginRight={4}
            backgroundColor={BackgroundColor.backgroundAlternative}
          ></Box>
        );
      })()}
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
    </Box>
  );
};

export default AssetChart;
