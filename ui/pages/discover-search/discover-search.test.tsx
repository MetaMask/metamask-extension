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
const mockGetIsPerpsExperienceAvailable = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../routes/global-menu-route-transition', () => ({
  useGlobalMenuRouteTransition: () => mockRunCloseTransition,
}));

jest.mock('../../hooks/discover-search/useDiscoverSearch', () => ({
  useDiscoverSearch: (options: unknown) => mockUseDiscoverSearch(options),
}));

const getDefaultDiscoverSearchResult = () => ({
  crypto: {
    id: 'crypto' as const,
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
        securityData: { resultType: 'Verified' },
      },
    ],
    isLoading: false,
    error: null,
    totalCount: 1,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
  },
  perps: {
    id: 'perps' as const,
    items: [],
    isLoading: false,
    error: null,
  },
  stocks: {
    id: 'stocks' as const,
    items: [
      {
        assetId: 'eip155:1/erc20:0xstock',
        name: 'Stock1',
        symbol: 'STK1',
        decimals: 18,
        price: '0.000131',
        marketCap: 20_000_000_000,
        aggregatedUsdVolume: 126_000_000,
        priceChangePct: { h24: '9.4' },
      },
    ],
    isLoading: false,
    error: null,
    totalCount: 1,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
  },
  isDebouncing: false,
});

const getEmptyDiscoverSearchResult = () => ({
  crypto: {
    id: 'crypto' as const,
    items: [],
    isLoading: false,
    error: null,
  },
  perps: {
    id: 'perps' as const,
    items: [],
    isLoading: false,
    error: null,
  },
  stocks: {
    id: 'stocks' as const,
    items: [],
    isLoading: false,
    error: null,
  },
  isDebouncing: false,
});

jest.mock('../../selectors/perps/feature-flags', () => ({
  getIsPerpsExperienceAvailable: () => mockGetIsPerpsExperienceAvailable(),
}));

const mockStore = configureMockStore();

describe('DiscoverSearchPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockRunCloseTransition.mockClear();
    mockGetIsPerpsExperienceAvailable.mockReturnValue(false);
    mockUseDiscoverSearch.mockReturnValue(getDefaultDiscoverSearchResult());
  });

  const renderPage = ({
    currentCurrency = 'usd',
    route = DISCOVER_SEARCH_ROUTE,
  } = {}) => {
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
      route,
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
    expect(screen.getByText('$2,500.00')).toBeInTheDocument();
    expect(screen.getByTestId('security-badge-icon')).toBeInTheDocument();
    expect(screen.getByText('<$0.01')).toBeInTheDocument();
  });

  it('restores the search query and active tab from the route query string', () => {
    renderPage({ route: `${DISCOVER_SEARCH_ROUTE}?q=eth&tab=crypto` });

    expect(screen.getByTestId('discover-search-input')).toHaveValue('eth');
    expect(mockUseDiscoverSearch).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'eth', activeTab: 'crypto' }),
    );
    expect(
      screen.getByTestId('discover-crypto-eip155:1/slip44:60'),
    ).toBeInTheDocument();
  });

  it('renders risky security badges for suspicious assets', () => {
    mockUseDiscoverSearch.mockReturnValue({
      ...getDefaultDiscoverSearchResult(),
      crypto: {
        ...getDefaultDiscoverSearchResult().crypto,
        items: [
          {
            ...getDefaultDiscoverSearchResult().crypto.items[0],
            securityData: { type: 'Warning' },
          },
        ],
      },
    });

    renderPage();

    expect(
      screen.getByText(messages.securityTrustRisky.message),
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

  it('loads the next Crypto search page once when scrolled near the bottom', () => {
    const fetchNextPage = jest.fn(() => new Promise(() => undefined));
    mockUseDiscoverSearch.mockReturnValue({
      ...getDefaultDiscoverSearchResult(),
      crypto: {
        ...getDefaultDiscoverSearchResult().crypto,
        hasNextPage: true,
        fetchNextPage,
      },
    });

    renderPage({ route: `${DISCOVER_SEARCH_ROUTE}?q=eth&tab=crypto` });

    const tabContent = screen
      .getByTestId('discover-search-page')
      .querySelector('.overflow-y-auto');
    expect(tabContent).not.toBeNull();
    if (!tabContent) {
      throw new Error('Expected Discover Search tab content');
    }
    Object.defineProperties(tabContent, {
      clientHeight: { configurable: true, value: 500 },
      scrollHeight: { configurable: true, value: 1000 },
      scrollTop: { configurable: true, value: 350 },
    });

    fireEvent.scroll(tabContent);
    fireEvent.scroll(tabContent);

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('shows View X more when an active search has more matches than the preview', () => {
    const cryptoItems = Array.from({ length: 5 }, (_, index) => ({
      assetId: `eip155:1/slip44:${60 + index}`,
      name: `Token ${index}`,
      symbol: `T${index}`,
      decimals: 18,
      price: '1',
      marketCap: 1,
      aggregatedUsdVolume: 1,
      priceChangePct: { h24: '1.23456' },
    }));

    mockUseDiscoverSearch.mockReturnValue({
      ...getDefaultDiscoverSearchResult(),
      crypto: {
        id: 'crypto',
        items: cryptoItems,
        isLoading: false,
        error: null,
        totalCount: 12,
      },
    });

    renderPage();

    fireEvent.change(screen.getByTestId('discover-search-input'), {
      target: { value: 'eth' },
    });

    expect(
      screen.getByText(messages.viewXMore.message.replace('$1', '9')),
    ).toBeInTheDocument();
  });

  it('hides the view-more action when search results fit in the preview', () => {
    mockUseDiscoverSearch.mockReturnValue({
      ...getDefaultDiscoverSearchResult(),
      crypto: {
        id: 'crypto',
        items: getDefaultDiscoverSearchResult().crypto.items,
        isLoading: false,
        error: null,
        totalCount: 2,
      },
      stocks: {
        id: 'stocks',
        items: [],
        isLoading: false,
        error: null,
        totalCount: 0,
      },
    });

    renderPage();

    fireEvent.change(screen.getByTestId('discover-search-input'), {
      target: { value: 'eth' },
    });

    expect(
      screen.queryByTestId('discover-section-crypto-view-all'),
    ).not.toBeInTheDocument();
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

  it('renders no results when the selected Perps tab is empty, regardless of other feeds loading', () => {
    mockGetIsPerpsExperienceAvailable.mockReturnValue(true);
    mockUseDiscoverSearch.mockReturnValue({
      ...getEmptyDiscoverSearchResult(),
      crypto: {
        ...getEmptyDiscoverSearchResult().crypto,
        isLoading: true,
      },
      stocks: {
        ...getEmptyDiscoverSearchResult().stocks,
        isLoading: true,
      },
    });
    renderPage({ route: `${DISCOVER_SEARCH_ROUTE}?q=eth&tab=perps` });

    expect(
      screen.getByTestId('discover-search-no-results'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('discover-search-loading'),
    ).not.toBeInTheDocument();
  });

  it('does not render other category results in an empty selected Perps tab', () => {
    mockGetIsPerpsExperienceAvailable.mockReturnValue(true);
    mockUseDiscoverSearch.mockReturnValue({
      ...getDefaultDiscoverSearchResult(),
      perps: {
        ...getDefaultDiscoverSearchResult().perps,
        items: [],
      },
    });
    renderPage();

    fireEvent.change(screen.getByTestId('discover-search-input'), {
      target: { value: 'eth' },
    });
    fireEvent.click(screen.getByTestId('discover-tab-perps'));

    expect(
      screen.getByTestId('discover-search-no-results'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('discover-crypto-preview-eip155:1/slip44:60'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('discover-section-crypto'),
    ).not.toBeInTheDocument();
  });
});
