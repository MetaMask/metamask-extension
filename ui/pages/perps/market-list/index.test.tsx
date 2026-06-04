import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import {
  mockCryptoMarkets,
  mockHip3Markets,
} from '../../../components/app/perps/mocks';

jest.mock('@metamask/perps-controller', () => ({
  HIP3_ASSET_MARKET_TYPES: {
    'xyz:TSLA': 'stock',
    'xyz:AAPL': 'stock',
    'xyz:MSFT': 'stock',
    'xyz:NVDA': 'stock',
    'xyz:AMZN': 'stock',
    'xyz:GOOGL': 'stock',
    'xyz:GOLD': 'commodity',
    'xyz:SILVER': 'commodity',
    'xyz:CL': 'commodity',
    'xyz:EUR': 'forex',
    'xyz:JPY': 'forex',
    'xyz:SPACEX': 'pre-ipo',
    'xyz:SP500': 'index',
    'xyz:SPY': 'etf',
  },
  MarketCategory: {
    CryptoCurrency: 'crypto',
    Stock: 'stock',
    PreIpo: 'pre-ipo',
    Index: 'index',
    Etf: 'etf',
    Commodity: 'commodity',
    Forex: 'forex',
  },
  MARKET_CATEGORIES: [
    'crypto',
    'stocks',
    'pre-ipo',
    'indices',
    'etfs',
    'commodities',
    'forex',
  ],
}));

// eslint-disable-next-line import-x/first
import { MarketListView } from '.';

const mockNavigate = jest.fn();

const mockSearchParams = new URLSearchParams();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}));

const mockUsePerpsLiveMarketListData = jest.fn();
jest.mock('../../../hooks/perps/stream', () => ({
  usePerpsLiveMarketListData: () => mockUsePerpsLiveMarketListData(),
  usePerpsLiveAccount: () => ({ account: null }),
}));

const mockExtraHip3Markets = [
  {
    symbol: 'xyz:EUR',
    name: 'EUR/USD',
    maxLeverage: '20x',
    price: '$1.085',
    change24h: '+$0.002',
    change24hPercent: '+0.18%',
    volume: '$50M',
    openInterest: '$200M',
    nextFundingTime: Date.now() + 3600000,
    fundingIntervalHours: 8,
    fundingRate: 0.00005,
    marketSource: 'xyz',
    marketType: 'forex',
  },
  {
    symbol: 'xyz:SPACEX',
    name: 'SpaceX',
    maxLeverage: '5x',
    price: '$250.00',
    change24h: '+$10.00',
    change24hPercent: '+4.17%',
    volume: '$30M',
    openInterest: '$100M',
    nextFundingTime: Date.now() + 3600000,
    fundingIntervalHours: 8,
    fundingRate: 0.0002,
    marketSource: 'xyz',
    marketType: 'pre-ipo',
  },
  {
    symbol: 'xyz:SP500',
    name: 'S&P 500',
    maxLeverage: '10x',
    price: '$5,200.00',
    change24h: '+$25.00',
    change24hPercent: '+0.48%',
    volume: '$60M',
    openInterest: '$300M',
    nextFundingTime: Date.now() + 3600000,
    fundingIntervalHours: 8,
    fundingRate: 0.00007,
    marketSource: 'xyz',
    marketType: 'index',
  },
  {
    symbol: 'xyz:SPY',
    name: 'SPDR S&P 500 ETF',
    maxLeverage: '10x',
    price: '$520.00',
    change24h: '+$2.50',
    change24hPercent: '+0.48%',
    volume: '$40M',
    openInterest: '$150M',
    nextFundingTime: Date.now() + 3600000,
    fundingIntervalHours: 8,
    fundingRate: 0.00006,
    marketSource: 'xyz',
    marketType: 'etf',
  },
];

const allMockMarkets = [
  ...mockCryptoMarkets,
  ...mockHip3Markets,
  ...mockExtraHip3Markets,
];

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
    remoteFeatureFlags: {
      perpsEnabledVersion: { enabled: true, minimumVersion: '0.0.0' },
    },
  },
});

describe('MarketListView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.delete('filter');
    // Default mock returns loaded state with markets
    mockUsePerpsLiveMarketListData.mockReturnValue({
      markets: allMockMarkets,
      cryptoMarkets: mockCryptoMarkets,
      hip3Markets: [...mockHip3Markets, ...mockExtraHip3Markets],
      isInitialLoading: false,
      error: null,
      refresh: jest.fn(),
    });
  });

  describe('rendering', () => {
    it('renders the market list view', () => {
      renderWithProvider(<MarketListView />, mockStore);

      expect(screen.getByTestId('market-list-view')).toBeInTheDocument();
    });

    it('displays search input', () => {
      renderWithProvider(<MarketListView />, mockStore);

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('displays filter dropdown', () => {
      renderWithProvider(<MarketListView />, mockStore);

      expect(screen.getByTestId('filter-select-button')).toBeInTheDocument();
    });

    it('displays sort dropdown', () => {
      renderWithProvider(<MarketListView />, mockStore);

      expect(screen.getByTestId('sort-dropdown-button')).toBeInTheDocument();
    });

    it('displays back button', () => {
      renderWithProvider(<MarketListView />, mockStore);

      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });

    it('renders live price and change values from the list hook', async () => {
      const [firstMarket] = mockCryptoMarkets;
      mockUsePerpsLiveMarketListData.mockReturnValue({
        markets: [
          {
            ...firstMarket,
            price: '$99,999',
            change24hPercent: '+9.9%',
          },
          ...mockCryptoMarkets.slice(1),
          ...mockHip3Markets,
        ],
        cryptoMarkets: mockCryptoMarkets,
        hip3Markets: mockHip3Markets,
        isInitialLoading: false,
        error: null,
        refresh: jest.fn(),
      });

      renderWithProvider(<MarketListView />, mockStore);

      await waitFor(() => {
        expect(screen.getByText('$99,999')).toBeInTheDocument();
        expect(screen.getByText('+9.9%')).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('shows loading skeletons initially', () => {
      // Override mock to return loading state
      mockUsePerpsLiveMarketListData.mockReturnValue({
        markets: [],
        cryptoMarkets: [],
        hip3Markets: [],
        isInitialLoading: true,
        error: null,
        refresh: jest.fn(),
      });

      renderWithProvider(<MarketListView />, mockStore);

      // Should have multiple skeleton elements
      const skeletons = screen.getAllByTestId(/market-row-skeleton/u);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders market rows after loading', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      await waitFor(() => {
        // Check for at least one market row after loading completes
        const marketRows = screen.queryAllByTestId(/^market-row-/u);
        expect(marketRows.length).toBeGreaterThan(0);
      });
    });
  });

  describe('navigation', () => {
    it('navigates back when back button is clicked', () => {
      renderWithProvider(<MarketListView />, mockStore);

      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('renders market rows that are clickable', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      // Wait for loading to complete (skeletons should disappear)
      await waitFor(
        () => {
          // Skeletons should no longer be visible
          const skeletons = screen.queryAllByTestId(/market-row-skeleton/u);
          expect(skeletons.length).toBe(0);
        },
        { timeout: 2000 },
      );

      // Now market rows should be visible (exclude skeleton matches)
      const marketRows = screen
        .getAllByTestId(/^market-row-/u)
        .filter((el) => !el.getAttribute('data-testid')?.includes('skeleton'));

      expect(marketRows.length).toBeGreaterThan(0);
      // Verify the row is clickable (has cursor-pointer class)
      expect(marketRows[0].className).toContain('cursor-pointer');
    });
  });

  describe('search functionality', () => {
    it('filters markets based on search query', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      await waitFor(() => {
        const marketRows = screen.queryAllByTestId(/^market-row-/u);
        expect(marketRows.length).toBeGreaterThan(0);
      });

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'BTC' } });

      await waitFor(() => {
        // Should filter to show only BTC market
        const marketRows = screen.queryAllByTestId(/^market-row-/u);
        expect(marketRows.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('shows empty state when no markets match search', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      await waitFor(() => {
        const marketRows = screen.queryAllByTestId(/^market-row-/u);
        expect(marketRows.length).toBeGreaterThan(0);
      });

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'xyznomatch123' } });

      await waitFor(() => {
        expect(screen.getByText(/no markets found/iu)).toBeInTheDocument();
      });
    });

    it('hides filter row when searching', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      await waitFor(() => {
        expect(
          screen.getByTestId('market-list-filter-sort-row'),
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'BTC' } });

      await waitFor(() => {
        expect(
          screen.queryByTestId('market-list-filter-sort-row'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('filter functionality', () => {
    it('opens filter dropdown on click', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      const filterButton = screen.getByTestId('filter-select-button');
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(screen.getByTestId('filter-select-menu')).toBeInTheDocument();
      });
    });

    it('shows stock markets on Stocks tab even when perpsHip3AllowlistMarkets flag is absent', async () => {
      // mockStore has no perpsHip3AllowlistMarkets flag → allowedHip3Sources defaults to Set()
      renderWithProvider(<MarketListView />, mockStore);

      // Open filter dropdown and click Stocks
      const filterButton = screen.getByTestId('filter-select-button');
      fireEvent.click(filterButton);
      await waitFor(() => screen.getByTestId('filter-select-menu'));
      fireEvent.click(screen.getByTestId('filter-select-option-stocks'));

      await waitFor(() => {
        // TSLA and AAPL are stock markets in mockHip3Markets
        expect(screen.getByTestId('market-row-xyz-TSLA')).toBeInTheDocument();
        expect(screen.getByTestId('market-row-xyz-AAPL')).toBeInTheDocument();
        // BTC is a crypto market and should be absent
        expect(screen.queryByTestId('market-row-BTC')).not.toBeInTheDocument();
      });
    });

    it('shows commodity markets on Commodities tab even when perpsHip3AllowlistMarkets flag is absent', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      const filterButton = screen.getByTestId('filter-select-button');
      fireEvent.click(filterButton);
      await waitFor(() => screen.getByTestId('filter-select-menu'));
      fireEvent.click(screen.getByTestId('filter-select-option-commodities'));

      await waitFor(() => {
        // GOLD and SILVER are commodity markets in mockHip3Markets
        expect(screen.getByTestId('market-row-xyz-GOLD')).toBeInTheDocument();
        expect(screen.getByTestId('market-row-xyz-SILVER')).toBeInTheDocument();
        // BTC is crypto and should be absent
        expect(screen.queryByTestId('market-row-BTC')).not.toBeInTheDocument();
      });
    });

    it('shows only crypto markets on Crypto tab regardless of allowedHip3Sources', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      const filterButton = screen.getByTestId('filter-select-button');
      fireEvent.click(filterButton);
      await waitFor(() => screen.getByTestId('filter-select-menu'));
      fireEvent.click(screen.getByTestId('filter-select-option-crypto'));

      await waitFor(() => {
        const btcRow = screen.queryByTestId('market-row-BTC');
        expect(btcRow).toBeInTheDocument();
        // HIP-3 stock market should not appear under Crypto
        expect(
          screen.queryByTestId('market-row-xyz-TSLA'),
        ).not.toBeInTheDocument();
      });
    });

    it('shows pre-ipo markets on Pre-IPO tab', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      const filterButton = screen.getByTestId('filter-select-button');
      fireEvent.click(filterButton);
      await waitFor(() => screen.getByTestId('filter-select-menu'));
      fireEvent.click(screen.getByTestId('filter-select-option-pre-ipo'));

      await waitFor(() => {
        expect(screen.getByTestId('market-row-xyz-SPACEX')).toBeInTheDocument();
        expect(
          screen.queryByTestId('market-row-xyz-TSLA'),
        ).not.toBeInTheDocument();
        expect(screen.queryByTestId('market-row-BTC')).not.toBeInTheDocument();
      });
    });

    it('shows index markets on Indices tab', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      const filterButton = screen.getByTestId('filter-select-button');
      fireEvent.click(filterButton);
      await waitFor(() => screen.getByTestId('filter-select-menu'));
      fireEvent.click(screen.getByTestId('filter-select-option-indices'));

      await waitFor(() => {
        expect(screen.getByTestId('market-row-xyz-SP500')).toBeInTheDocument();
        expect(
          screen.queryByTestId('market-row-xyz-TSLA'),
        ).not.toBeInTheDocument();
        expect(screen.queryByTestId('market-row-BTC')).not.toBeInTheDocument();
      });
    });

    it('shows etf markets on ETFs tab', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      const filterButton = screen.getByTestId('filter-select-button');
      fireEvent.click(filterButton);
      await waitFor(() => screen.getByTestId('filter-select-menu'));
      fireEvent.click(screen.getByTestId('filter-select-option-etfs'));

      await waitFor(() => {
        expect(screen.getByTestId('market-row-xyz-SPY')).toBeInTheDocument();
        expect(
          screen.queryByTestId('market-row-xyz-TSLA'),
        ).not.toBeInTheDocument();
        expect(screen.queryByTestId('market-row-BTC')).not.toBeInTheDocument();
      });
    });

    it('shows forex markets on Forex tab', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      const filterButton = screen.getByTestId('filter-select-button');
      fireEvent.click(filterButton);
      await waitFor(() => screen.getByTestId('filter-select-menu'));
      fireEvent.click(screen.getByTestId('filter-select-option-forex'));

      await waitFor(() => {
        expect(screen.getByTestId('market-row-xyz-EUR')).toBeInTheDocument();
        expect(
          screen.queryByTestId('market-row-xyz-TSLA'),
        ).not.toBeInTheDocument();
        expect(screen.queryByTestId('market-row-BTC')).not.toBeInTheDocument();
      });
    });
  });

  describe('deeplink URL filter initialization', () => {
    it('initializes with stocks filter from URL param', async () => {
      mockSearchParams.set('filter', 'stocks');
      renderWithProvider(<MarketListView />, mockStore);

      await waitFor(() => {
        expect(screen.getByTestId('market-row-xyz-TSLA')).toBeInTheDocument();
        expect(screen.queryByTestId('market-row-BTC')).not.toBeInTheDocument();
      });
    });

    it('initializes with pre-ipo filter from URL param', async () => {
      mockSearchParams.set('filter', 'pre-ipo');
      renderWithProvider(<MarketListView />, mockStore);

      await waitFor(() => {
        expect(screen.getByTestId('market-row-xyz-SPACEX')).toBeInTheDocument();
        expect(screen.queryByTestId('market-row-BTC')).not.toBeInTheDocument();
      });
    });

    it('initializes with indices filter from URL param', async () => {
      mockSearchParams.set('filter', 'indices');
      renderWithProvider(<MarketListView />, mockStore);

      await waitFor(() => {
        expect(screen.getByTestId('market-row-xyz-SP500')).toBeInTheDocument();
        expect(screen.queryByTestId('market-row-BTC')).not.toBeInTheDocument();
      });
    });

    it('initializes with etfs filter from URL param', async () => {
      mockSearchParams.set('filter', 'etfs');
      renderWithProvider(<MarketListView />, mockStore);

      await waitFor(() => {
        expect(screen.getByTestId('market-row-xyz-SPY')).toBeInTheDocument();
        expect(screen.queryByTestId('market-row-BTC')).not.toBeInTheDocument();
      });
    });

    it('defaults to all filter for invalid URL param', async () => {
      mockSearchParams.set('filter', 'bogus');
      renderWithProvider(<MarketListView />, mockStore);

      await waitFor(() => {
        expect(screen.getByTestId('market-row-BTC')).toBeInTheDocument();
        expect(screen.getByTestId('market-row-xyz-TSLA')).toBeInTheDocument();
      });
    });
  });

  describe('sort functionality', () => {
    it('opens sort dropdown on click', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      const sortButton = screen.getByTestId('sort-dropdown-button');
      fireEvent.click(sortButton);

      await waitFor(() => {
        expect(screen.getByTestId('sort-field-modal')).toBeInTheDocument();
      });
    });
  });
});
