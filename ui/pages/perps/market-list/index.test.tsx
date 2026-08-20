/* eslint-disable @typescript-eslint/naming-convention -- MetaMetrics event properties use snake_case */
import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
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
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';
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
const mockSetFlowAttribution = jest.fn();
jest.mock('../../../hooks/perps/usePerpsAttribution', () => ({
  usePerpsAttribution: () => ({
    setFlowAttribution: mockSetFlowAttribution,
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

      expect(
        screen.getByTestId('parent-selector-perps-market-list'),
      ).toBeInTheDocument();
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

      expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
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

  describe('search funnel analytics', () => {
    const typeSearch = (value: string) => {
      fireEvent.change(screen.getByTestId('search-input'), {
        target: { value },
      });
    };

    const eventsNamed = (name: MetaMetricsEventName) =>
      mockTrack.mock.calls.filter(([eventName]) => eventName === name);

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('emits a debounced search query with the settled result count', () => {
      renderWithProvider(<MarketListView />, mockStore);

      typeSearch('BTC');
      // Nothing before the debounce elapses — mid-typing is not a search.
      expect(eventsNamed(MetaMetricsEventName.PerpsSearchQuery)).toHaveLength(
        0,
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      const [queryCall] = eventsNamed(MetaMetricsEventName.PerpsSearchQuery);
      expect(queryCall[1]).toEqual(
        expect.objectContaining({
          search_query: 'btc',
          mode: 'intent',
          source: 'perp_market_search',
        }),
      );
      expect(queryCall[1].results_count).toBeGreaterThan(0);
      // The matching results screen view rides along with the query event.
      expect(
        mockTrack.mock.calls.filter(
          ([name, props]) =>
            name === MetaMetricsEventName.PerpsScreenViewed &&
            props?.screen_type === 'search_results_shown',
        ),
      ).toHaveLength(1);
    });

    it('reports a no-results screen view when nothing matches', () => {
      renderWithProvider(<MarketListView />, mockStore);

      typeSearch('xyznomatch123');
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(
        mockTrack.mock.calls.filter(
          ([name, props]) =>
            name === MetaMetricsEventName.PerpsScreenViewed &&
            props?.screen_type === 'search_no_results',
        ),
      ).toHaveLength(1);
    });

    it('emits search_result_tapped with the picked rank and no abandonment', () => {
      renderWithProvider(<MarketListView />, mockStore);

      typeSearch('BTC');
      act(() => {
        jest.advanceTimersByTime(500);
      });

      const [firstRow] = screen.queryAllByTestId(/^market-row-/u);
      fireEvent.click(firstRow);

      const [tapCall] = eventsNamed(
        MetaMetricsEventName.PerpsSearchResultTapped,
      );
      expect(tapCall[1]).toEqual(
        expect.objectContaining({ search_query: 'btc', result_rank: 1 }),
      );
      // A tapped result resolves the search: it was not abandoned.
      expect(
        eventsNamed(MetaMetricsEventName.PerpsSearchAbandoned),
      ).toHaveLength(0);
    });

    it('emits search_abandoned when the query is cleared without a tap', () => {
      renderWithProvider(<MarketListView />, mockStore);

      typeSearch('BTC');
      act(() => {
        jest.advanceTimersByTime(500);
      });
      // Escape clears the box through the same onClear path as the clear button.
      fireEvent.keyDown(screen.getByTestId('search-input'), { key: 'Escape' });

      const [abandonCall] = eventsNamed(
        MetaMetricsEventName.PerpsSearchAbandoned,
      );
      expect(abandonCall[1]).toEqual(
        expect.objectContaining({ search_query: 'btc', query_count: 1 }),
      );
    });

    it('attributes discovery to search when the tap came from a query', () => {
      renderWithProvider(<MarketListView />, mockStore);

      typeSearch('BTC');
      act(() => {
        jest.advanceTimersByTime(500);
      });
      const [firstRow] = screen.queryAllByTestId(/^market-row-/u);
      fireEvent.click(firstRow);

      // The query funnel reports perp_market_search as its source, so the trade
      // that follows must not claim market-list discovery.
      expect(mockSetFlowAttribution).toHaveBeenCalledWith(
        expect.objectContaining({ discoverySource: 'perp_market_search' }),
      );
    });

    it('keeps market-list discovery for a tap with no active query', () => {
      renderWithProvider(<MarketListView />, mockStore);

      const [firstRow] = screen.queryAllByTestId(/^market-row-/u);
      fireEvent.click(firstRow);

      expect(mockSetFlowAttribution).toHaveBeenCalledWith(
        expect.objectContaining({
          discoverySource: 'perps_market_list_all',
        }),
      );
    });

    it('reports the searched result count when a no-match query is cleared mid-debounce', () => {
      renderWithProvider(<MarketListView />, mockStore);

      typeSearch('xyznomatch123');
      act(() => {
        jest.advanceTimersByTime(200);
      });
      // Clearing re-renders with the FULL market list before the flush runs, so
      // the flushed query must use the count it had while it was on screen.
      typeSearch('');

      const [queryCall] = eventsNamed(MetaMetricsEventName.PerpsSearchQuery);
      expect(queryCall?.[1]).toEqual(
        expect.objectContaining({
          search_query: 'xyznomatch123',
          results_count: 0,
          has_results: false,
        }),
      );
    });

    it('emits the query then the tap when a result is picked inside the debounce window', () => {
      renderWithProvider(<MarketListView />, mockStore);

      typeSearch('BTC');
      const [firstRow] = screen.queryAllByTestId(/^market-row-/u);
      fireEvent.click(firstRow);

      // A fast tap flushes the pending query first, so the funnel is never a
      // tap with no preceding search.
      expect(eventsNamed(MetaMetricsEventName.PerpsSearchQuery)).toHaveLength(
        1,
      );
      const [tapCall] = eventsNamed(
        MetaMetricsEventName.PerpsSearchResultTapped,
      );
      expect(tapCall[1]).toEqual(
        expect.objectContaining({ search_query: 'btc', result_rank: 1 }),
      );
      expect(
        eventsNamed(MetaMetricsEventName.PerpsSearchAbandoned),
      ).toHaveLength(0);
    });

    it('reports the search funnel when the popup is dismissed without unmounting', () => {
      renderWithProvider(<MarketListView />, mockStore);

      typeSearch('BTC');
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Dismissing the extension popup hides the page without unmounting React,
      // so effect teardown never runs — the funnel has to close on `pagehide`,
      // the same lifecycle the abandon-order hook already handles.
      act(() => {
        window.dispatchEvent(new Event('pagehide'));
      });

      const [abandonCall] = eventsNamed(
        MetaMetricsEventName.PerpsSearchAbandoned,
      );
      expect(abandonCall?.[1]).toEqual(
        expect.objectContaining({ search_query: 'btc', query_count: 1 }),
      );
    });

    it('flushes a pending query when the box is cleared inside the debounce window', () => {
      renderWithProvider(<MarketListView />, mockStore);

      typeSearch('BTC');
      act(() => {
        jest.advanceTimersByTime(200);
      });
      // Cleared before the 500ms debounce fires. The query was still typed and
      // the results were shown, so the funnel must record it rather than drop
      // it — the fast-tap and unmount paths already flush.
      typeSearch('');

      const [queryCall] = eventsNamed(MetaMetricsEventName.PerpsSearchQuery);
      expect(queryCall?.[1]).toEqual(
        expect.objectContaining({ search_query: 'btc' }),
      );
      const [abandonCall] = eventsNamed(
        MetaMetricsEventName.PerpsSearchAbandoned,
      );
      expect(abandonCall?.[1]).toEqual(
        expect.objectContaining({ search_query: 'btc', query_count: 1 }),
      );
    });

    it('abandons and resets the session when the query is backspaced to empty', () => {
      renderWithProvider(<MarketListView />, mockStore);

      typeSearch('BTC');
      act(() => {
        jest.advanceTimersByTime(500);
      });
      typeSearch('');

      const [abandonCall] = eventsNamed(
        MetaMetricsEventName.PerpsSearchAbandoned,
      );
      expect(abandonCall[1]).toEqual(
        expect.objectContaining({ search_query: 'btc', query_count: 1 }),
      );

      // Session is fully reset: tapping a row from the now-unfiltered list must
      // not report a tap against the previous query.
      const [firstRow] = screen.queryAllByTestId(/^market-row-/u);
      fireEvent.click(firstRow);

      expect(
        eventsNamed(MetaMetricsEventName.PerpsSearchResultTapped),
      ).toHaveLength(0);
    });
  });
});
