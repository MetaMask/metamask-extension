import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { PerpsMarketExpandedChartPanel } from './perps-market-expanded-chart-panel';

let mockCandlesLoading = false;
let latestChartHeight: number | undefined;
jest.mock('../../../../hooks/perps/stream', () => ({
  usePerpsLiveCandles: () => ({
    candleData: {
      candles: [{ close: '45000', time: 1, open: '1', high: '1', low: '1' }],
    },
    isInitialLoading: mockCandlesLoading,
    fetchMoreHistory: jest.fn(),
  }),
}));

jest.mock('../perps-candlestick-chart', () => ({
  PerpsCandlestickChart: jest
    .requireActual<typeof import('react')>('react')
    .forwardRef(({ height }: { height: number }, _ref: React.Ref<unknown>) => {
      latestChartHeight = height;
      return <div data-testid="perps-expanded-chart" />;
    }),
}));

jest.mock('../perps-candle-period-selector', () => ({
  PerpsCandlePeriodSelector: () => (
    <div data-testid="perps-candle-period-selector" />
  ),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const defaultProps = {
  symbol: 'BTC',
  marketPrice: 45000,
  positions: [],
  onCurrentPriceChange: jest.fn(),
};

describe('PerpsMarketExpandedChartPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCandlesLoading = false;
    latestChartHeight = undefined;

    class ResizeObserverMock {
      readonly #callback: ResizeObserverCallback;

      constructor(callback: ResizeObserverCallback) {
        this.#callback = callback;
      }

      observe() {
        this.#callback(
          [
            {
              contentRect: { height: 390 },
            } as ResizeObserverEntry,
          ],
          this as unknown as ResizeObserver,
        );
      }

      disconnect() {
        return undefined;
      }
    }

    global.ResizeObserver =
      ResizeObserverMock as unknown as typeof ResizeObserver;
  });

  it('renders the skeleton in the chart container while loading', () => {
    mockCandlesLoading = true;

    renderWithProvider(
      <PerpsMarketExpandedChartPanel {...defaultProps} />,
      mockStore,
    );

    expect(
      screen.getByTestId('perps-expanded-chart-panel'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('perps-expanded-chart-area')).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-expanded-chart-skeleton'),
    ).toBeInTheDocument();
  });

  it('renders the chart without changing the wrapper when loaded', () => {
    renderWithProvider(
      <PerpsMarketExpandedChartPanel {...defaultProps} />,
      mockStore,
    );

    expect(
      screen.getByTestId('perps-expanded-chart-panel'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('perps-expanded-chart-area')).toBeInTheDocument();
    expect(screen.getByTestId('perps-expanded-chart')).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-candle-period-selector'),
    ).toBeInTheDocument();
    expect(latestChartHeight).toBe(390);
  });
});
