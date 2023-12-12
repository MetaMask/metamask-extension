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
import { produceWithPatches } from 'immer';
import { getCurrentCurrency, getTokenList } from '../../../selectors';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { TextVariant } from '../../../helpers/constants/design-system';
import {
  Box,
  ButtonSecondary,
  ButtonSecondarySize,
  Text,
} from '../../../components/component-library';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';

const TokenAssetV2 = ({ token }: { token: Token }) => {
  // todo do we support all of these? fallback to something like usd?
  // can controller export list of supported?
  // see token rates controller
  const currency = useSelector(getCurrentCurrency);
  const tokenList = useSelector(getTokenList);

  // todo chain id?
  const tokenData = Object.values(tokenList).find(
    (t) =>
      t.symbol === token.symbol &&
      isEqualCaseInsensitive(t.address, token.address),
  );
  const name = tokenData?.name || token.symbol;

  const [spotPrices, setSpotPrices] = useState<any>(); // todo better type
  const [prices, setHistoricalPrices] = useState<any>(); // todo better type
  const [timeRange, setTimeRange] = useState('1D');

  // todo chain id
  // todo canonicalize address?
  // cache these when clicking between????

  useEffect(() => {
    fetch(
      `https://price-api.metafi.codefi.network/v1/chains/1/spot-prices/${token.address}?vsCurrency=${currency}`,
    )
      .then((data) => data.json())
      .then((data) => setSpotPrices(data));
  }, [token.address, currency]);

  // todo for big time ranges do we need to reduce number of data points client side?

  useEffect(() => {
    fetch(
      `https://price-api.metafi.codefi.network/v1/chains/1/historical-prices/${token.address}?vsCurrency=${currency}&timePeriod=${timeRange}`,
    )
      .then((data) => data.json())
      .then((data) => setHistoricalPrices(data.prices));
  }, [token.address, currency, timeRange]);

  if (!prices) {
    return <></>;
  }

  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];

  // Green if up, red if down
  const up = lastPrice[1] > firstPrice[1];
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

  return (
    <>
      <Box padding={4}>
        <Text>
          {name} ({token.symbol})
        </Text>
        <Text variant={TextVariant.headingLg}>
          {formatCurrency(spotPrices?.price, currency)}
        </Text>
      </Box>
      <Line data={data} options={options} updateMode="none" />
      <ButtonSecondary
        onClick={() => setTimeRange('1D')}
        size={ButtonSecondarySize.Sm}
      >
        1D
      </ButtonSecondary>
      <ButtonSecondary
        onClick={() => setTimeRange('7D')}
        size={ButtonSecondarySize.Sm}
      >
        1W
      </ButtonSecondary>
      <ButtonSecondary
        onClick={() => setTimeRange('1M')}
        size={ButtonSecondarySize.Sm}
      >
        1M
      </ButtonSecondary>
      <ButtonSecondary
        onClick={() => setTimeRange('3M')}
        size={ButtonSecondarySize.Sm}
      >
        3M
      </ButtonSecondary>
      <ButtonSecondary
        onClick={() => setTimeRange('1Y')}
        size={ButtonSecondarySize.Sm}
      >
        1Y
      </ButtonSecondary>
      <ButtonSecondary
        onClick={() => setTimeRange('5Y')}
        size={ButtonSecondarySize.Sm}
      >
        5Y
      </ButtonSecondary>
      <ButtonSecondary size={ButtonSecondarySize.Sm}>ALL</ButtonSecondary>
    </>
  );
};

export default TokenAssetV2;
