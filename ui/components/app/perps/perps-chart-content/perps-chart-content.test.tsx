import React from 'react';
import { screen } from '@testing-library/react';
import type { CandleData } from '@metamask/perps-controller';

import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import { CandlePeriod } from '../constants/chartConfig';
import { PerpsChartContent } from './perps-chart-content';

jest.mock('../perps-candlestick-chart', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockReact = require('react');
  return {
    PerpsCandlestickChart: mockReact.forwardRef(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (props: any, _ref: any) =>
        mockReact.createElement('div', {
          'data-testid': 'perps-candlestick-chart',
          'data-price-lines': JSON.stringify(props.priceLines ?? []),
        }),
    ),
  };
});

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const candleData: CandleData = {
  symbol: 'ETH',
  interval: '5m',
  candles: [
    {
      time: 1768188300000,
      open: '2880.0',
      high: '2920.0',
      low: '2870.0',
      close: '2900.0',
      volume: '100.0',
    },
  ],
};

describe('PerpsChartContent', () => {
  it('renders a loading skeleton while candles have not arrived', () => {
    renderWithProvider(
      <PerpsChartContent
        isLoading={true}
        error={null}
        candleData={null}
        selectedPeriod={CandlePeriod.FiveMinutes}
        currentPrice={0}
      />,
      mockStore,
    );

    expect(
      screen.getByTestId('perps-chart-content-loading'),
    ).toBeInTheDocument();
  });

  it('renders the localized error state when loading fails', () => {
    renderWithProvider(
      <PerpsChartContent
        isLoading={false}
        error={new Error('stream failed')}
        candleData={null}
        selectedPeriod={CandlePeriod.FiveMinutes}
        currentPrice={0}
      />,
      mockStore,
    );

    expect(screen.getByTestId('perps-chart-content-error')).toHaveTextContent(
      'Failed to load chart data',
    );
  });

  it('renders the chart once candle data is available', () => {
    renderWithProvider(
      <PerpsChartContent
        isLoading={false}
        error={null}
        candleData={candleData}
        selectedPeriod={CandlePeriod.FiveMinutes}
        currentPrice={2900}
        priceLines={[{ price: 2900, label: '', color: '#fff' }]}
      />,
      mockStore,
    );

    expect(screen.getByTestId('perps-candlestick-chart')).toBeInTheDocument();
  });
});
