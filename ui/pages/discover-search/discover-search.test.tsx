import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { DISCOVER_SEARCH_ROUTE } from '../../helpers/constants/routes';
import { DiscoverSearchPage } from './discover-search';

const mockNavigate = jest.fn();
const mockRunCloseTransition = jest.fn((callback: () => void) => callback());

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../routes/global-menu-route-transition', () => ({
  useGlobalMenuRouteTransition: () => mockRunCloseTransition,
}));

jest.mock('../../hooks/discover-search', () => ({
  DISCOVER_SEARCH_PREVIEW_COUNT: 3,
  useDiscoverSearch: () => ({
    crypto: {
      id: 'crypto',
      titleKey: 'perpsFilterCrypto',
      items: [
        {
          assetId: 'eip155:1/slip44:60',
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
          price: '2500',
          marketCap: 20_000_000_000,
          aggregatedUsdVolume: 126_000_000,
          priceChangePct: { h24: '0.02' },
        },
      ],
      isLoading: false,
      error: null,
    },
    perps: {
      id: 'perps',
      titleKey: 'perps',
      items: [],
      isLoading: false,
      error: null,
    },
    stocks: {
      id: 'stocks',
      titleKey: 'perpsFilterStocks',
      items: [
        {
          assetId: 'eip155:1/erc20:0xstock',
          name: 'Stock1',
          symbol: 'STK1',
          decimals: 18,
          price: '406.78',
          marketCap: 20_000_000_000,
          aggregatedUsdVolume: 126_000_000,
          priceChangePct: { h24: '9.4' },
        },
      ],
      isLoading: false,
      error: null,
    },
    isDebouncing: false,
  }),
}));

jest.mock('../../selectors/perps/feature-flags', () => ({
  getIsPerpsExperienceAvailable: () => false,
}));

const mockStore = configureMockStore();

describe('DiscoverSearchPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockRunCloseTransition.mockClear();
  });

  const renderPage = () => {
    const store = mockStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        currentCurrency: 'usd',
      },
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    return renderWithProvider(
      <QueryClientProvider client={queryClient}>
        <DiscoverSearchPage />
      </QueryClientProvider>,
      store,
      { initialEntries: [DISCOVER_SEARCH_ROUTE] },
    );
  };

  it('renders search input, tabs, and All section previews', () => {
    renderPage();

    expect(screen.getByTestId('discover-search-page')).toBeInTheDocument();
    expect(screen.getByTestId('discover-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('discover-tab-all')).toBeInTheDocument();
    expect(screen.getByTestId('discover-tab-crypto')).toBeInTheDocument();
    expect(screen.getByTestId('discover-tab-stocks')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('Stock1')).toBeInTheDocument();
  });

  it('switches to Crypto tab when View all is clicked', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('discover-section-crypto-view-all'));

    // Crypto tab content uses full-list test ids (not preview-prefixed ones).
    expect(
      screen.getByTestId('discover-crypto-eip155:1/slip44:60'),
    ).toBeInTheDocument();
  });

  it('navigates home on back', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('discover-search-back-button'));

    expect(mockRunCloseTransition).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
