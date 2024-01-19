import React, { useEffect, useState } from 'react';
import 'chartjs-adapter-moment';
import { useSelector } from 'react-redux';
import {
  Chart,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Tooltip,
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
  Tooltip,
  CrosshairPlugin,
);

const aspectRatio = 1.3;

const getChartOptions = (currency: string) =>
  ({
    aspectRatio,
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
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#EBEBEB',
        titleColor: '#24272A',
        bodyColor: '#24272A',
        yAlign: 'bottom',
        caretPadding: 100000,
        displayColors: false,
        callbacks: {
          label: (ctx: any) =>
            formatCurrency(ctx.raw, currency, getPricePrecision(ctx.raw)),
        },
      },
      crosshair: {
        zoom: { enabled: false },
        line: {
          color: '#BBC0C5',
          width: 2,
        },
      },
    },
  } as const);

// A chart showing historic prices for a native or token asset
const AssetChart = ({
  address,
  symbol,
}: {
  address: string;
  symbol: string;
}) => {
  const t = useI18nContext();
  const chainId = hexToDecimal(useSelector(getCurrentChainId));
  const currency = useSelector(getCurrentCurrency);

  const [prices, setPrices] = useState<any>();
  const [timeRange, setTimeRange] = useState<TimeRange>('1D');

  // TODO: consider exposing this fetch through a controller
  useEffect(() => {
    setPrices(undefined);
    fetch(
      `https://price-api.metafi-dev.codefi.network/v1/chains/${chainId}/historical-prices/${address}?vsCurrency=${currency}&timePeriod=${timeRange}`,
    )
      .then((resp) => (resp.status === 200 ? resp.json() : { prices: [] }))
      .then((data) => setPrices(data.prices));
  }, [chainId, address, currency, timeRange]);

  let priceDelta, pricePercent, data;
  if (prices?.length > 0) {
    const firstPrice = prices[0][1];
    const lastPrice = prices[prices.length - 1][1];
    priceDelta = lastPrice - firstPrice;
    pricePercent = 100 * ((lastPrice - firstPrice) / firstPrice);

    // Green if up, red if down
    const up = priceDelta >= 0;
    const borderColor = up ? '#28A745' : '#D73847';
    const gradientStart = up
      ? 'rgba(40, 167, 69, 0.30)'
      : 'rgba(229, 0, 0, 0.30)';
    const gradientEnd = 'rgba(217, 217, 217, 0.00)';

    data = {
      labels: prices.map((item: any) => new Date(item[0])),
      datasets: [
        {
          label: symbol,
          data: prices.map((item: any) => item[1]),
          borderColor,
          backgroundColor: (context: ScriptableContext<'line'>) => {
            const gradient = context.chart.ctx.createLinearGradient(
              0,
              0,
              0,
              context.chart.height,
            );
            gradient.addColorStop(0, gradientStart);
            gradient.addColorStop(1, gradientEnd);
            return gradient;
          },
        },
      ],
    };
  }

  // background --background-default-pressed

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
      <Box padding={4} paddingTop={0} paddingBottom={4}>
        {priceDelta !== undefined && pricePercent !== undefined ? (
          <>
            {priceDelta >= 0 ? chartUp : chartDown}
            <Text
              display={Display.InlineBlock}
              marginLeft={1}
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
          </>
        ) : (
          // Placeholder to take up same amount of room during loading
          <Text>{'\u00A0'}</Text>
        )}
      </Box>
      {(function () {
        if (data) {
          return (
            <Line
              data={data}
              options={getChartOptions(currency)}
              updateMode="none"
            />
          );
        }
        return prices?.length === 0 ? (
          <Box
            style={{ height: `${100/aspectRatio}vw` }}
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
          // TODO: This box is a skeleton for the chart while data is fetching. It (and the box above)
          // should be the same height as the chart, which maintains a 1:2 aspect ratio. 50vw is perfect
          // in popup mode, but is too large in fullscreen mode since the full viewport is not used.
          // We really want height to be "50% of the parent's width", not 50% of the viewport's width.
          <Box
            style={{ height: `${100/aspectRatio}vw` }}
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
