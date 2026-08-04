import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { DISCOVER_SEARCH_ROUTE } from '../../helpers/constants/routes';
import { DiscoverSearchPage } from './discover-search';

const mockNavigate = jest.fn();
const mockRunCloseTransition = jest.fn((callback: () => void) => callback());
const mockUseDiscoverSearch = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../routes/global-menu-route-transition', () => ({
  useGlobalMenuRouteTransition: () => mockRunCloseTransition,
}));

jest.mock('../../hooks/discover-search/useDiscoverSearch', () => ({
  useDiscoverSearch: () => mockUseDiscoverSearch(),
}));

const getDefaultDiscoverSearchResult = () => ({
  crypto: {
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
    items: [],
    isLoading: false,
    error: null,
  },
  stocks: {
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
});

const getEmptyDiscoverSearchResult = () => ({
  crypto: {
    items: [],
    isLoading: false,
    error: null,
  },
  perps: {
    items: [],
    isLoading: false,
    error: null,
  },
  stocks: {
    items: [],
    isLoading: false,
    error: null,
  },
  isDebouncing: false,
});

jest.mock('../../selectors/perps/feature-flags', () => ({
  getIsPerpsExperienceAvailable: () => false,
}));

const mockStore = configureMockStore();

describe('DiscoverSearchPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockRunCloseTransition.mockClear();
    mockUseDiscoverSearch.mockReturnValue(getDefaultDiscoverSearchResult());
  });

  const renderPage = ({ currentCurrency = 'usd' } = {}) => {
    const store = mockStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        currentCurrency,
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
      DISCOVER_SEARCH_ROUTE,
    );
  };

  it('renders search input, tabs, and All section previews', () => {
    renderPage();

    expect(screen.getByTestId('discover-search-page')).toBeInTheDocument();
    expect(screen.getByTestId('discover-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('discover-tab-all')).toBeInTheDocument();
    expect(screen.getByTestId('discover-tab-crypto')).toBeInTheDocument();
    expect(screen.getByTestId('discover-tab-stocks')).toBeInTheDocument();
    expect(
      screen.getByText(messages.networkNameEthereum.message),
    ).toBeInTheDocument();
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

  it('navigates to the CAIP asset route when an asset result is clicked', () => {
    renderPage();

    fireEvent.click(
      screen.getByTestId('discover-crypto-preview-eip155:1/slip44:60'),
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      '/asset/eip155:1/eip155%3A1%2Fslip44%3A60',
    );
  });

  it('renders no-results search design and opens popular assets', () => {
    const searchQuery = 'erwerwqer';

    mockUseDiscoverSearch.mockReturnValue(getEmptyDiscoverSearchResult());
    renderPage();

    fireEvent.change(screen.getByTestId('discover-search-input'), {
      target: { value: searchQuery },
    });

    expect(
      screen.getByText(
        messages.discoverSearchNoResultsFor.message.replace('$1', searchQuery),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.discoverSearchPopularAssets.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('discover-search-no-results-illustration'),
    ).toHaveAttribute('src', './images/empty-state-activity-light.png');
    expect(
      screen.getByTestId('discover-search-popular-asset-eth-network'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('discover-search-popular-asset-btc-network'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('discover-search-popular-asset-sol-network'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('discover-search-popular-asset-btc'));

    expect(mockNavigate).toHaveBeenCalledWith(
      '/asset/bip122:000000000019d6689c085ae165831e93/bip122%3A000000000019d6689c085ae165831e93%2Fslip44%3A0',
    );
  });

  it('renders no-results search design on empty category tabs', () => {
    const searchQuery = 'erwerwqer';

    mockUseDiscoverSearch.mockReturnValue(getEmptyDiscoverSearchResult());
    renderPage();

    fireEvent.change(screen.getByTestId('discover-search-input'), {
      target: { value: searchQuery },
    });
    fireEvent.click(screen.getByTestId('discover-tab-crypto'));

    expect(
      screen.getByTestId('discover-search-no-results'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        messages.discoverSearchNoResultsFor.message.replace('$1', searchQuery),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.discoverSearchPopularAssets.message),
    ).toBeInTheDocument();
  });
});
