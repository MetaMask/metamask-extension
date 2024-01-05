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
import {
  getCurrentChainId,
  getCurrentCurrency,
  getTokenList,
} from '../../../selectors';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import {
  Display,
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
  Text,
} from '../../../components/component-library';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import { useI18nContext } from '../../../hooks/useI18nContext';

/** Time range units supported by the price API */
type TimeRange = `${number}D` | `${number}M` | `${number}Y`;

const TokenAssetV2 = ({ token }: { token: Token }) => {
  const t = useI18nContext();

  // todo what if chain not supported?  how to determine?
  const chainId = hexToDecimal(useSelector(getCurrentChainId));

  // todo do we support all of these? fallback to something like usd?
  // can controller export list of supported?
  // see token rates controller
  const currency = useSelector(getCurrentCurrency);
  const tokenList = useSelector(getTokenList);

  // todo chain id?
  const tokenData = Object.values(tokenList).find(
    (listToken) =>
      listToken.symbol === token.symbol &&
      isEqualCaseInsensitive(listToken.address, token.address),
  );
  const name = tokenData?.name || token.symbol;

  const [spotPrices, setSpotPrices] = useState<any>(); // todo better type
  const [prices, setHistoricalPrices] = useState<any>(); // todo better type
  const [timeRange, setTimeRange] = useState<TimeRange>('1D');

  // todo canonicalize address?  is that necessary?
  // cache these when clicking between????

  // todo what if
  useEffect(() => {
    fetch(
      `https://price-api.metafi.codefi.network/v1/chains/${chainId}/spot-prices/${token.address}?vsCurrency=${currency}`,
    )
      .then((data) => data.json())
      .then((data) => setSpotPrices(data));
  }, [chainId, token.address, currency]);

  // todo for big time ranges do we need to reduce number of data points client side?

  useEffect(() => {
    fetch(
      `https://price-api.metafi.codefi.network/v1/chains/${chainId}/historical-prices/${token.address}?vsCurrency=${currency}&timePeriod=${timeRange}`,
    )
      .then((data) => data.json())
      .then((data) => setHistoricalPrices(data.prices));
  }, [chainId, token.address, currency, timeRange]);

  if (!prices) {
    return <></>;
  }

  // Green if up, red if down
  const firstPrice = prices[0][1];
  const lastPrice = prices[prices.length - 1][1];
  const priceDelta = lastPrice - firstPrice;
  const up = priceDelta >= 0;
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

  const options = {
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
        caretPadding: 10000,
      },
      crosshair: {
        line: {
          color: '#BBC0C5',
          width: 2,
        },
      },
    },
  } as const;

  Chart.register(
    TimeScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    CrosshairPlugin,
  );

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
    <>
      <Box padding={4}>
        <Text>
          {name} ({token.symbol})
        </Text>
        <Text variant={TextVariant.headingLg}>
          {formatCurrency(spotPrices?.price, currency)}
        </Text>
        {/* TODO: These icons for chart up/down */}
        {priceDelta >= 0 ? (
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
        ) : (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.75 7.1875L5.25 3.5125L3.91667 5.6125L1.25 2.8125"
              stroke="#D73847"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M7.08398 7.1875H8.75065V5.4375"
              stroke="#D73847"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        )}
        <Text
          display={Display.InlineBlock}
          margin={1}
          color={
            priceDelta >= 0 ? TextColor.successDefault : TextColor.errorDefault
          }
        >
          ${priceDelta.toFixed(2)} (
          {(100 * ((lastPrice - firstPrice) / firstPrice)).toFixed(2)}%)
        </Text>
      </Box>
      <Line data={data} options={options} updateMode="none" />
      <Box display={Display.Flex} justifyContent={JustifyContent.spaceEvenly}>
        {getButton(t('oneDay'), '1D')}
        {getButton(t('oneWeek'), '7D')}
        {getButton(t('oneMonth'), '1M')}
        {getButton(t('threeMonths'), '3M')}
        {getButton(t('oneYear'), '1Y')}
        {getButton(t('all'), '1000Y')}
      </Box>
    </>
  );
};

export default TokenAssetV2;
