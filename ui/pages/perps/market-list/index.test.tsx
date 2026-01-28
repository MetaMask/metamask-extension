import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { MarketListView } from '.';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
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
    localStorage.clear();
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

    it('displays category badges', () => {
      renderWithProvider(<MarketListView />, mockStore);

      expect(
        screen.getByTestId('category-badges-unselected'),
      ).toBeInTheDocument();
    });

    it('displays sort dropdown', () => {
      renderWithProvider(<MarketListView />, mockStore);

      expect(screen.getByTestId('sort-dropdown-button')).toBeInTheDocument();
    });

    it('displays back button', () => {
      renderWithProvider(<MarketListView />, mockStore);

      expect(screen.getByTestId('back-button')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows loading skeletons initially', () => {
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

    it('hides category and sort rows when searching', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      await waitFor(() => {
        expect(
          screen.getByTestId('market-list-category-row'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('market-list-sort-row')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'BTC' } });

      await waitFor(() => {
        expect(
          screen.queryByTestId('market-list-category-row'),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId('market-list-sort-row'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('category filter functionality', () => {
    it('shows all category badges when no filter is selected', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      await waitFor(() => {
        expect(
          screen.getByTestId('category-badge-watchlist'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('category-badge-crypto')).toBeInTheDocument();
        expect(screen.getByTestId('category-badge-stocks')).toBeInTheDocument();
        expect(
          screen.getByTestId('category-badge-commodities'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('category-badge-forex')).toBeInTheDocument();
      });
    });

    it('filters to crypto markets when crypto badge is clicked', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      await waitFor(() => {
        const skeletons = screen.queryAllByTestId(/market-row-skeleton/u);
        expect(skeletons.length).toBe(0);
      });

      fireEvent.click(screen.getByTestId('category-badge-crypto'));

      await waitFor(() => {
        // Should show only the selected badge
        expect(
          screen.getByTestId('category-badges-selected'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('category-badge-crypto')).toBeInTheDocument();
      });
    });

    it('shows dismiss button when category is selected', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      await waitFor(() => {
        const skeletons = screen.queryAllByTestId(/market-row-skeleton/u);
        expect(skeletons.length).toBe(0);
      });

      fireEvent.click(screen.getByTestId('category-badge-stocks'));

      await waitFor(() => {
        expect(
          screen.getByTestId('category-badge-stocks-dismiss'),
        ).toBeInTheDocument();
      });
    });

    it('clears filter when dismiss button is clicked', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      await waitFor(() => {
        const skeletons = screen.queryAllByTestId(/market-row-skeleton/u);
        expect(skeletons.length).toBe(0);
      });

      // Select a category
      fireEvent.click(screen.getByTestId('category-badge-crypto'));

      await waitFor(() => {
        expect(
          screen.getByTestId('category-badge-crypto-dismiss'),
        ).toBeInTheDocument();
      });

      // Click dismiss
      fireEvent.click(screen.getByTestId('category-badge-crypto-dismiss'));

      await waitFor(() => {
        // Should show all badges again
        expect(
          screen.getByTestId('category-badges-unselected'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('watchlist functionality', () => {
    it('shows empty watchlist state when watchlist is selected and empty', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      await waitFor(() => {
        const skeletons = screen.queryAllByTestId(/market-row-skeleton/u);
        expect(skeletons.length).toBe(0);
      });

      // Click watchlist badge
      fireEvent.click(screen.getByTestId('category-badge-watchlist'));

      await waitFor(() => {
        expect(screen.getByTestId('watchlist-empty-state')).toBeInTheDocument();
      });
    });
  });

  describe('sort functionality', () => {
    it('opens sort dropdown on click', async () => {
      renderWithProvider(<MarketListView />, mockStore);

      const sortButton = screen.getByTestId('sort-dropdown-button');
      fireEvent.click(sortButton);

      await waitFor(() => {
        expect(screen.getByTestId('sort-dropdown-menu')).toBeInTheDocument();
      });
    });
  });
});
