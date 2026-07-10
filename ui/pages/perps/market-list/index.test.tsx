/* eslint-disable @typescript-eslint/naming-convention -- MetaMetrics event properties use snake_case */
import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  en as messages,
  renderWithProvider,
} from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import {
  mockCryptoMarkets,
  mockHip3Markets,
} from '../../../components/app/perps/mocks';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { MarketListView } from '.';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Capture imperative track() calls; declarative ScreenViewed is a no-op here.
const mockTrack = jest.fn();
jest.mock('../../../hooks/perps/usePerpsEventTracking', () => ({
  usePerpsEventTracking: (options?: unknown) =>
    options ? undefined : { track: mockTrack },
}));

const mockUsePerpsLiveMarketListData = jest.fn();
jest.mock('../../../hooks/perps/usePerpsAttribution', () => ({
  usePerpsAttribution: () => ({
    setFlowAttribution: jest.fn(),
  }),
}));
jest.mock('../../../hooks/perps/stream', () => ({
  usePerpsLiveMarketListData: () => mockUsePerpsLiveMarketListData(),
  usePerpsLiveAccount: () => ({ account: null }),
}));

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
    // Default mock returns loaded state with markets
    mockUsePerpsLiveMarketListData.mockReturnValue({
      markets: [...mockCryptoMarkets, ...mockHip3Markets],
      cryptoMarkets: mockCryptoMarkets,
      hip3Markets: mockHip3Markets,
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
        expect(
          screen.getByTestId('perps-market-list-no-results'),
        ).toBeInTheDocument();
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

    const filterLabelCases: [filter: string, expectedLabel: string][] = [
      ['pre-ipo', messages.perpsFilterPreIpo.message],
      ['index', messages.perpsFilterIndex.message],
      ['etf', messages.perpsFilterEtf.message],
    ];

    filterLabelCases.forEach(([filter, expectedLabel]) => {
      it(`shows a visible label for the ${filter} filter query param`, async () => {
        renderWithProvider(
          <MarketListView />,
          mockStore,
          `/perps/market-list?filter=${filter}`,
        );

        await waitFor(() => {
          expect(screen.getByTestId('filter-select-button')).toHaveTextContent(
            expectedLabel,
          );
        });
      });
    });

    it('shows stock markets on Stocks tab even when perpsHip3AllowlistMarkets flag is absent', async () => {
      // mockStore has no perpsHip3AllowlistMarkets flag → allowedHip3Sources defaults to Set()
      renderWithProvider(<MarketListView />, mockStore);

      // Open filter dropdown and click Stocks
      const filterButton = screen.getByTestId('filter-select-button');
      fireEvent.click(filterButton);
      await waitFor(() => screen.getByTestId('filter-select-menu'));
      fireEvent.click(screen.getByTestId('filter-select-option-stock'));

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
      fireEvent.click(screen.getByTestId('filter-select-option-commodity'));

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

  describe('sort/filter analytics', () => {
    it('fires sort_applied with sort_field and sort_direction on sort apply', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      fireEvent.click(screen.getByTestId('sort-dropdown-button'));
      await waitFor(() => {
        expect(screen.getByTestId('sort-field-modal')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('sort-field-option-priceChange'));
      fireEvent.click(screen.getByTestId('sort-direction-asc'));
      fireEvent.click(screen.getByTestId('sort-modal-apply'));

      expect(mockTrack).toHaveBeenCalledWith(
        MetaMetricsEventName.PerpsUiInteraction,
        expect.objectContaining({
          interaction_type: 'sort_applied',
          sort_field: 'priceChange',
          sort_direction: 'asc',
        }),
      );
    });

    it('fires filter_applied with filter_category on category select', () => {
      renderWithProvider(<MarketListView />, mockStore);

      fireEvent.click(screen.getByTestId('filter-select-button'));
      fireEvent.click(screen.getByTestId('filter-select-option-crypto'));

      expect(mockTrack).toHaveBeenCalledWith(
        MetaMetricsEventName.PerpsUiInteraction,
        expect.objectContaining({
          interaction_type: 'filter_applied',
          filter_category: 'crypto',
        }),
      );
    });
  });
});
