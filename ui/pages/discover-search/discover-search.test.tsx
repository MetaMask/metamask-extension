import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
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
const mockEnsureNetworkEnabled = jest.fn();
const mockToastSuccess = jest.fn();
const mockTrackEvent = jest.fn(() => Promise.resolve());

jest.mock('../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({
      createEventBuilder,
      trackEvent: mockTrackEvent,
      trackErrorAsAnalytics: jest.fn(() => Promise.resolve()),
    }),
  };
});

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

jest.mock('../../hooks/useEnableFeaturedEvmNetwork', () => ({
  useEnableFeaturedEvmNetwork: () => mockEnsureNetworkEnabled,
}));

jest.mock('../../components/ui/toast/toast', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
  ToastContent: ({
    title,
    dataTestId,
  }: {
    title: string;
    dataTestId?: string;
  }) => <div data-testid={dataTestId}>{title}</div>,
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
  getIsPerpsShowFullAssetNamesEnabled: () => false,
}));

const mockStore = configureMockStore();

describe('DiscoverSearchPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockRunCloseTransition.mockClear();
    mockGetIsPerpsExperienceAvailable.mockReturnValue(false);
    mockUseDiscoverSearch.mockReturnValue(getDefaultDiscoverSearchResult());
    mockEnsureNetworkEnabled.mockResolvedValue(null);
    mockToastSuccess.mockClear();
    mockTrackEvent.mockClear();
  });

  const renderPage = ({
    currentCurrency = 'usd',
    route = DISCOVER_SEARCH_ROUTE,
    remoteFeatureFlags = {},
  }: {
    currentCurrency?: string;
    route?: string;
    remoteFeatureFlags?: Record<string, unknown>;
  } = {}) => {
    const store = mockStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        currentCurrency,
        remoteFeatureFlags: {
          ...mockState.metamask.remoteFeatureFlags,
          ...remoteFeatureFlags,
        },
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

  it('navigates back on back button click', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('discover-search-back-button'));

    expect(mockRunCloseTransition).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates to the CAIP asset route when an asset result is clicked', async () => {
    renderPage();

    fireEvent.click(
      screen.getByTestId('discover-crypto-preview-eip155:1/slip44:60'),
    );

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        '/asset/eip155:1/eip155%3A1%2Fslip44%3A60',
      ),
    );
  });

  it('shows a success toast when it enables a popular network', async () => {
    mockEnsureNetworkEnabled.mockResolvedValue({ name: 'Base' });
    renderPage();

    fireEvent.click(
      screen.getByTestId('discover-crypto-preview-eip155:1/slip44:60'),
    );

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        '/asset/eip155:1/eip155%3A1%2Fslip44%3A60',
      ),
    );
    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          dataTestId: 'discover-network-added-success-toast',
        }),
      }),
    );
  });

  it('renders no-results search design and opens popular assets', async () => {
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

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        '/asset/bip122:000000000019d6689c085ae165831e93/bip122%3A000000000019d6689c085ae165831e93%2Fslip44%3A0',
      ),
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

  describe('Stocks promotion on exact ticker or company name match', () => {
    const PROMOTE_FLAG_ON = {
      exploreSearchPromoteStocksExactTicker: {
        enabled: true,
        minimumVersion: '0.0.0',
      },
    };

    const PROMOTE_FLAG_OFF = {
      exploreSearchPromoteStocksExactTicker: {
        enabled: false,
        minimumVersion: '0.0.0',
      },
    };

    const mockTslaResult = () => ({
      ...getDefaultDiscoverSearchResult(),
      crypto: {
        ...getDefaultDiscoverSearchResult().crypto,
        items: [
          {
            assetId: 'eip155:1/erc20:0xtslameme',
            name: 'TSLA Memecoin',
            symbol: 'TSLA',
            decimals: 18,
            price: '0.01',
            marketCap: 100_000,
            aggregatedUsdVolume: 50_000,
            priceChangePct: { h24: '5.0' },
          },
        ],
        totalCount: 1,
      },
      stocks: {
        ...getDefaultDiscoverSearchResult().stocks,
        items: [
          {
            assetId: 'eip155:1/erc20:0xtslaon',
            name: 'Tesla (Ondo Tokenized)',
            symbol: 'TSLAon',
            decimals: 18,
            price: '250.00',
            marketCap: 20_000_000_000,
            aggregatedUsdVolume: 126_000_000,
            priceChangePct: { h24: '1.2' },
            rwaData: {
              ticker: 'TSLA',
              instrumentType: 'equity',
            },
          },
          {
            assetId: 'eip155:1/erc20:0xmsftx',
            name: 'Microsoft xStock',
            symbol: 'MSFTx',
            decimals: 18,
            price: '420.00',
            marketCap: 20_000_000_000,
            aggregatedUsdVolume: 126_000_000,
            priceChangePct: { h24: '0.8' },
            rwaData: {
              ticker: 'MSFT',
              instrumentType: 'equity',
            },
          },
        ],
        totalCount: 2,
      },
    });

    const getRenderedSectionOrder = () =>
      Array.from(
        screen
          .getByTestId('discover-search-page')
          .querySelectorAll('[data-testid^="discover-section-"]'),
      )
        .map((el) => el.getAttribute('data-testid'))
        .filter((id) => !id?.endsWith('-view-all'));

    it.each([
      'TSLA',
      'tsla',
      '$TSLA',
      '  $TSLA  ',
      'Tesla',
      'tesla',
      'Tesla (Ondo Tokenized)',
      'Microsoft',
    ])(
      'renders Stocks above Crypto for exact match query %p when flag is enabled',
      (query) => {
        mockUseDiscoverSearch.mockReturnValue(mockTslaResult());

        renderPage({
          route: `${DISCOVER_SEARCH_ROUTE}?q=${encodeURIComponent(query)}`,
          remoteFeatureFlags: PROMOTE_FLAG_ON,
        });

        expect(getRenderedSectionOrder()).toStrictEqual([
          'discover-section-stocks',
          'discover-section-crypto',
        ]);
        expect(
          screen.getAllByTestId('discover-search-section-divider'),
        ).toHaveLength(1);
      },
    );

    it('promotes Stocks above both Crypto and Perps while keeping tab order unchanged', () => {
      mockGetIsPerpsExperienceAvailable.mockReturnValue(true);
      mockUseDiscoverSearch.mockReturnValue({
        ...mockTslaResult(),
        perps: {
          id: 'perps' as const,
          items: [
            {
              symbol: 'TSLA-USD',
              name: 'Tesla',
              price: '$250.00',
              markPrice: '250',
              change24hPercent: '+1.50%',
              volume: '$1M',
              volume24h: '1000000',
              leverage: '10x',
              openInterest: '$500K',
              maxLeverage: 10,
            },
          ],
          isLoading: false,
          error: null,
          totalCount: 1,
        },
      });

      renderPage({
        route: `${DISCOVER_SEARCH_ROUTE}?q=TSLA`,
        remoteFeatureFlags: PROMOTE_FLAG_ON,
      });

      expect(getRenderedSectionOrder()).toStrictEqual([
        'discover-section-stocks',
        'discover-section-crypto',
        'discover-section-perps',
      ]);
      expect(
        screen.getAllByTestId('discover-search-section-divider'),
      ).toHaveLength(2);

      const tabIds = Array.from(
        screen
          .getByTestId('discover-search-page')
          .querySelectorAll('[data-testid^="discover-tab-"]'),
      ).map((el) => el.getAttribute('data-testid'));
      expect(tabIds).toStrictEqual([
        'discover-tab-all',
        'discover-tab-crypto',
        'discover-tab-perps',
        'discover-tab-stocks',
      ]);
    });

    it.each(['TSL', 'tesl', 'eth'])(
      'keeps Crypto above Stocks for non-exact query %p',
      (query) => {
        mockUseDiscoverSearch.mockReturnValue(mockTslaResult());

        renderPage({
          route: `${DISCOVER_SEARCH_ROUTE}?q=${encodeURIComponent(query)}`,
          remoteFeatureFlags: PROMOTE_FLAG_ON,
        });

        expect(getRenderedSectionOrder()).toStrictEqual([
          'discover-section-crypto',
          'discover-section-stocks',
        ]);
      },
    );

    it('keeps Crypto above Stocks when the remote flag is off', () => {
      mockUseDiscoverSearch.mockReturnValue(mockTslaResult());

      renderPage({
        route: `${DISCOVER_SEARCH_ROUTE}?q=TSLA`,
        remoteFeatureFlags: PROMOTE_FLAG_OFF,
      });

      expect(getRenderedSectionOrder()).toStrictEqual([
        'discover-section-crypto',
        'discover-section-stocks',
      ]);
    });

    it('does not reorder while Stocks is loading', () => {
      const result = mockTslaResult();
      mockUseDiscoverSearch.mockReturnValue({
        ...result,
        stocks: {
          ...result.stocks,
          isLoading: true,
        },
      });

      renderPage({
        route: `${DISCOVER_SEARCH_ROUTE}?q=TSLA`,
        remoteFeatureFlags: PROMOTE_FLAG_ON,
      });

      expect(getRenderedSectionOrder()).toStrictEqual([
        'discover-section-crypto',
        'discover-section-stocks',
      ]);
    });

    it('does not reorder when Stocks has no results or items have no rwaData', () => {
      const result = mockTslaResult();
      mockUseDiscoverSearch.mockReturnValue({
        ...result,
        stocks: {
          ...result.stocks,
          items: [
            {
              ...result.stocks.items[0],
              symbol: 'TSLA',
              rwaData: undefined,
            },
          ],
        },
      });

      renderPage({
        route: `${DISCOVER_SEARCH_ROUTE}?q=TSLA`,
        remoteFeatureFlags: PROMOTE_FLAG_ON,
      });

      expect(getRenderedSectionOrder()).toStrictEqual([
        'discover-section-crypto',
        'discover-section-stocks',
      ]);
    });

    it('tracks stocks_promoted on searched, result_clicked, tab_switched, and scrolled analytics events', async () => {
      mockUseDiscoverSearch.mockReturnValue(mockTslaResult());

      renderPage({
        route: `${DISCOVER_SEARCH_ROUTE}?q=TSLA`,
        remoteFeatureFlags: PROMOTE_FLAG_ON,
      });

      await waitFor(() =>
        expect(mockTrackEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            properties: expect.objectContaining({
              interaction_type: 'searched',
              search_query: 'TSLA',
              stocks_promoted: true,
            }),
          }),
        ),
      );

      fireEvent.click(
        screen.getByTestId('discover-stocks-preview-eip155:1/erc20:0xtslaon'),
      );

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            interaction_type: 'result_clicked',
            section_name: 'stocks',
            stocks_promoted: true,
          }),
        }),
      );

      const scrollContainer = screen
        .getByTestId('discover-search-page')
        .querySelector('.overflow-y-auto');
      expect(scrollContainer).not.toBeNull();
      if (scrollContainer) {
        fireEvent.scroll(scrollContainer);
      }

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            interaction_type: 'scrolled',
            stocks_promoted: true,
          }),
        }),
      );

      fireEvent.click(screen.getByTestId('discover-tab-stocks'));

      await waitFor(() =>
        expect(mockTrackEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            properties: expect.objectContaining({
              interaction_type: 'tab_switched',
              tab_name: 'stocks',
              stocks_promoted: true,
            }),
          }),
        ),
      );
    });

    it('tracks stocks_promoted=false when promotion is inactive', async () => {
      mockUseDiscoverSearch.mockReturnValue(mockTslaResult());

      renderPage({
        route: `${DISCOVER_SEARCH_ROUTE}?q=TSLA`,
        remoteFeatureFlags: PROMOTE_FLAG_OFF,
      });

      await waitFor(() =>
        expect(mockTrackEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            properties: expect.objectContaining({
              interaction_type: 'searched',
              search_query: 'TSLA',
              stocks_promoted: false,
            }),
          }),
        ),
      );
    });
  });
});
