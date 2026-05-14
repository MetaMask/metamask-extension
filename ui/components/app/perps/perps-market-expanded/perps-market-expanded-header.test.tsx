import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import type { PerpsMarketData } from '@metamask/perps-controller';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { submitRequestToBackground } from '../../../../store/background-connection';
import {
  PerpsMarketExpandedHeader,
  PerpsMarketExpandedHeaderSkeleton,
} from './perps-market-expanded-header';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

jest.mock('../../../../hooks/perps/stream', () => ({
  usePerpsLivePrices: () => ({
    prices: {
      BTC: {
        symbol: 'BTC',
        price: '45010',
        percentChange24h: '2.00%',
        markPrice: '45001',
      },
    },
  }),
}));

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../perps-market-selector', () => ({
  PerpsMarketSelector: ({
    onMarketSelect,
  }: {
    onMarketSelect: (symbol: string) => void;
  }) => (
    <button
      type="button"
      data-testid="perps-market-selector-button"
      onClick={() => onMarketSelect('ETH')}
    >
      BTC-USD
    </button>
  ),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const market = {
  symbol: 'BTC',
  name: 'Bitcoin',
  price: '$45,000.00',
  change24hPercent: '1.00%',
  maxLeverage: '50x',
  volume: '$1B',
  openInterest: '$500M',
  fundingRate: 0.0001,
} as unknown as PerpsMarketData;

describe('PerpsMarketExpandedHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the compact header and calls header actions', () => {
    renderWithProvider(
      <PerpsMarketExpandedHeader
        markets={[market]}
        market={market}
        currentSymbol="BTC"
        chartCurrentPrice={45000}
      />,
      mockStore,
    );

    expect(screen.getByTestId('perps-expanded-header')).toBeInTheDocument();
    expect(screen.getByText('$45,000')).toBeInTheDocument();
    expect(screen.getByText('+2.00%')).toBeInTheDocument();
    expect(screen.getByText('$1B')).toBeInTheDocument();
    expect(screen.getByText('$500M')).toBeInTheDocument();
    expect(screen.getByTestId('perps-expanded-header')).toHaveClass(
      'px-4',
      'py-2',
      'gap-3',
    );
    expect(screen.getByTestId('perps-expanded-header')).toHaveStyle({
      gridTemplateColumns:
        '36px 192px 118px 92px 92px 156px 92px minmax(12px, 1fr) 36px',
    });
    expect(screen.getByText('0.0100%')).toBeInTheDocument();
    expect(screen.getByTestId('perps-expanded-price-change')).not.toHaveClass(
      'border-l',
      'pl-3',
    );

    fireEvent.click(screen.getByTestId('perps-expanded-back-button'));
    fireEvent.click(screen.getByTestId('perps-market-selector-button'));
    fireEvent.click(screen.getByTestId('perps-expanded-favorite-button'));

    expect(mockUseNavigate).toHaveBeenCalledTimes(2);
    expect(submitRequestToBackground).toHaveBeenCalledWith(
      'perpsToggleWatchlistMarket',
      ['BTC'],
    );
  });

  it('renders the fixed-grid skeleton', () => {
    renderWithProvider(<PerpsMarketExpandedHeaderSkeleton />, mockStore);

    expect(
      screen.getByTestId('perps-expanded-header-skeleton'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('perps-expanded-header-skeleton')).toHaveClass(
      'px-4',
      'py-2',
      'gap-3',
    );
    expect(screen.getByTestId('perps-expanded-header-skeleton')).toHaveStyle({
      gridTemplateColumns:
        '36px 192px 118px 92px 92px 156px 92px minmax(12px, 1fr) 36px',
    });
  });
});
