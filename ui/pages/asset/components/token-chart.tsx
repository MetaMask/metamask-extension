import React, { useEffect, useState } from 'react';
import 'chartjs-adapter-moment';
import { Token } from '@metamask/assets-controllers';
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
  BlockSize,
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

const chartOptions = {
  layout: { autoPadding: false },
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
    },
    crosshair: {
      zoom: { enabled: false },
      line: {
        color: '#BBC0C5',
        width: 2,
      },
    },
  },
} as const;

const TokenChart = ({ token }: { token: Token }) => {
  const t = useI18nContext();

  // todo what if chain not supported?  how to determine?
  const chainId = hexToDecimal(useSelector(getCurrentChainId));

  // todo do we support all of these? fallback to something like usd?
  // can controller export list of supported?
  // see token rates controller
  const currency = useSelector(getCurrentCurrency);

  const [prices, setPrices] = useState<any>(); // todo better type?
  const [timeRange, setTimeRange] = useState<TimeRange>('1D');

  // todo canonicalize address?  is that necessary?
  // cache these when clicking between???? for a limited amount of time?

  // todo handle 404?
  // todo for big time ranges do we need to reduce number of data points client side?
  useEffect(() => {
    setPrices(undefined);
    // todo delete delay
    new Promise((r) => setTimeout(r, 2000))
      .then(() =>
        fetch(
          `https://price-api.metafi-dev.codefi.network/v1/chains/${chainId}/historical-prices/${token.address}?vsCurrency=${currency}&timePeriod=${timeRange}`,
        ),
      )
      .then((resp) => (resp.status === 200 ? resp.json() : { prices: [] }))
      .then((data) => setPrices(data.prices));
  }, [chainId, token.address, currency, timeRange]);

  const renderChart = () => {
    if (prices === undefined) {
      return (
        <Box
          style={{ height: '50vw' }}
          borderRadius={BorderRadius.LG}
          margin={4}
          backgroundColor={BackgroundColor.backgroundAlternative}
        ></Box>
      );
    } else if (prices.length === 0) {
      return (
        <Box
          style={{ height: '50vw' }}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          borderRadius={BorderRadius.LG}
          margin={4}
          // height={BlockSize.Full}
          backgroundColor={BackgroundColor.backgroundAlternative}
        >
          <Icon name={IconName.Info} size={IconSize.Xl} />
          <br />
          <Text>No chart data</Text>
          <br />
          <Text>We could not fetch any data for this token</Text>
        </Box>
      );
    }

    const firstPrice = prices[0][1];
    const lastPrice = prices[prices.length - 1][1];
    const priceDelta = lastPrice - firstPrice;
    const up = priceDelta >= 0;

    // Green if up, red if down
    const lineColor = up ? '#28A745' : '#D73847';
    const gradientStart = up
      ? 'rgba(40, 167, 69, 0.30)'
      : 'rgba(229, 0, 0, 0.30)';
    const gradientEnd = 'rgba(217, 217, 217, 0.00)';

    const data = {
      labels: prices.map((item: any) => new Date(item[0])),
      datasets: [
        {
          label: token.symbol,
          data: prices.map((item: any) => item[1]),
          borderColor: lineColor,
          elements: {
            line: { borderWidth: 2 },
            point: { pointStyle: false },
          },
          fill: true,
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

    return (
      <>
        <Box padding={4} paddingTop={0}>
          {priceDelta >= 0 ? chartUp : chartDown}
          <Text
            display={Display.InlineBlock}
            margin={1}
            color={
              priceDelta >= 0
                ? TextColor.successDefault
                : TextColor.errorDefault
            }
          >
            {formatCurrency(Math.abs(priceDelta).toFixed(2), currency)} (
            {priceDelta >= 0 ? '+' : ''}
            {(100 * ((lastPrice - firstPrice) / firstPrice)).toFixed(2)}%)
          </Text>
        </Box>
        <Line data={data} options={chartOptions} updateMode="none" />
      </>
    );
  };

  const getButton = (label: string, range: TimeRange) => {
    const opts = { onClick: () => setTimeRange(range) };
    return range === timeRange ? (
      <ButtonPrimary {...opts} size={ButtonPrimarySize.Sm}>
        {label}
      </ButtonPrimary>
    ) : (
      <ButtonSecondary {...opts} size={ButtonSecondarySize.Sm}>
        {label}
      </ButtonSecondary>
    );
  };

  return (
    <Box>
      {renderChart()}
      <Box display={Display.Flex} justifyContent={JustifyContent.spaceEvenly}>
        {getButton(t('oneDay'), '1D')}
        {getButton(t('oneWeek'), '7D')}
        {getButton(t('oneMonth'), '1M')}
        {getButton(t('threeMonths'), '3M')}
        {getButton(t('oneYear'), '1Y')}
        {getButton(t('all'), '1000Y')}
      </Box>
    </Box>
  );
};

export default TokenChart;
