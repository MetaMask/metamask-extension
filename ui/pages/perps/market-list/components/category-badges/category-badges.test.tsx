import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { CategoryBadges, type CategoryFilter } from './category-badges';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('CategoryBadges', () => {
  const defaultProps = {
    selectedCategory: null as CategoryFilter | null,
    onSelectCategory: jest.fn(),
    isWatchlistSelected: false,
    onToggleWatchlist: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('unselected state', () => {
    it('renders all category badges when nothing is selected', () => {
      renderWithProvider(<CategoryBadges {...defaultProps} />, mockStore);

      expect(
        screen.getByTestId('category-badges-unselected'),
      ).toBeInTheDocument();
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

    it('displays category labels', () => {
      renderWithProvider(<CategoryBadges {...defaultProps} />, mockStore);

      expect(screen.getByText('Crypto')).toBeInTheDocument();
      expect(screen.getByText('Stocks')).toBeInTheDocument();
      expect(screen.getByText('Commodities')).toBeInTheDocument();
      expect(screen.getByText('Forex')).toBeInTheDocument();
    });
  });

  describe('category selection', () => {
    it('calls onSelectCategory when a category badge is clicked', () => {
      const onSelectCategory = jest.fn();
      renderWithProvider(
        <CategoryBadges {...defaultProps} onSelectCategory={onSelectCategory} />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('category-badge-crypto'));

      expect(onSelectCategory).toHaveBeenCalledWith('crypto');
    });

    it('renders only selected category badge with dismiss button when a category is selected', () => {
      renderWithProvider(
        <CategoryBadges {...defaultProps} selectedCategory="crypto" />,
        mockStore,
      );

      expect(
        screen.getByTestId('category-badges-selected'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('category-badge-crypto')).toBeInTheDocument();
      expect(
        screen.getByTestId('category-badge-crypto-dismiss'),
      ).toBeInTheDocument();

      // Other badges should not be visible
      expect(
        screen.queryByTestId('category-badge-stocks'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('category-badge-commodities'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('category-badge-forex'),
      ).not.toBeInTheDocument();
    });

    it('calls onSelectCategory with null when dismiss button is clicked', () => {
      const onSelectCategory = jest.fn();
      renderWithProvider(
        <CategoryBadges
          {...defaultProps}
          selectedCategory="stocks"
          onSelectCategory={onSelectCategory}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('category-badge-stocks-dismiss'));

      expect(onSelectCategory).toHaveBeenCalledWith(null);
    });
  });

  describe('watchlist selection', () => {
    it('calls onToggleWatchlist when watchlist badge is clicked', () => {
      const onToggleWatchlist = jest.fn();
      renderWithProvider(
        <CategoryBadges
          {...defaultProps}
          onToggleWatchlist={onToggleWatchlist}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('category-badge-watchlist'));

      expect(onToggleWatchlist).toHaveBeenCalled();
    });

    it('renders only watchlist badge with dismiss button when watchlist is selected', () => {
      renderWithProvider(
        <CategoryBadges {...defaultProps} isWatchlistSelected />,
        mockStore,
      );

      expect(
        screen.getByTestId('category-badges-selected'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('category-badge-watchlist'),
      ).toBeInTheDocument();

      // Other badges should not be visible
      expect(
        screen.queryByTestId('category-badge-crypto'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('category-badge-stocks'),
      ).not.toBeInTheDocument();
    });

    it('clears category selection when watchlist is toggled while category is selected', () => {
      const onSelectCategory = jest.fn();
      const onToggleWatchlist = jest.fn();
      renderWithProvider(
        <CategoryBadges
          {...defaultProps}
          selectedCategory={null}
          onSelectCategory={onSelectCategory}
          onToggleWatchlist={onToggleWatchlist}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('category-badge-watchlist'));

      expect(onToggleWatchlist).toHaveBeenCalled();
    });
  });

  describe('mutual exclusivity', () => {
    it('clears watchlist when category is selected while watchlist is active', () => {
      const onSelectCategory = jest.fn();
      const onToggleWatchlist = jest.fn();

      // Start with watchlist not selected to see all badges
      renderWithProvider(
        <CategoryBadges
          {...defaultProps}
          isWatchlistSelected={false}
          onSelectCategory={onSelectCategory}
          onToggleWatchlist={onToggleWatchlist}
        />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('category-badge-crypto'));

      expect(onSelectCategory).toHaveBeenCalledWith('crypto');
    });
  });
});
