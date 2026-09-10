import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import type { MarketFilter } from '../../../../../shared/constants/perps';
import { PerpsCategoryRail, SKELETON_PILL_COUNT } from './perps-category-rail';

const mockStore = configureStore({ metamask: { ...mockState.metamask } });

const CATEGORIES: MarketFilter[] = [
  'crypto',
  'stock',
  'pre-ipo',
  'index',
  'etf',
  'commodity',
  'forex',
];

const renderRail = (
  props: Partial<React.ComponentProps<typeof PerpsCategoryRail>> = {},
) =>
  renderWithProvider(
    <PerpsCategoryRail
      categories={CATEGORIES}
      selectedCategory={null}
      onSelect={jest.fn()}
      onClear={jest.fn()}
      ariaLabel={messages.perpsMarketCategories.message}
      {...props}
    />,
    mockStore,
  );

const pillCategories = () =>
  screen
    .getAllByTestId(/^perps-market-categories-pill-/u)
    .map((pill) =>
      pill.dataset.testid?.replace('perps-market-categories-pill-', ''),
    );

describe('PerpsCategoryRail', () => {
  describe('layout', () => {
    it('renders every category as a pill, in the given order', () => {
      renderRail();

      expect(pillCategories()).toStrictEqual(CATEGORIES);
    });

    it('wraps the pills instead of hiding any of them', () => {
      renderRail();

      const rail = screen.getByTestId('perps-market-categories');

      // Wrapping is what keeps every category on screen: neither a horizontal
      // scroller nor an overflow menu may take its place.
      expect(rail).toHaveClass('flex-wrap');
      expect(rail).not.toHaveClass('overflow-x-auto');
      expect(
        screen.queryByTestId('perps-market-categories-more-button'),
      ).not.toBeInTheDocument();
    });

    it('renders nothing when there are no categories', () => {
      renderRail({ categories: [] });

      expect(
        screen.queryByTestId('perps-market-categories'),
      ).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('reserves the rail height with skeleton pills while market data loads', () => {
      renderRail({ isLoading: true });

      expect(
        screen.getByTestId('perps-market-categories-skeleton').children,
      ).toHaveLength(SKELETON_PILL_COUNT);
      expect(
        screen.queryByTestId('perps-market-categories'),
      ).not.toBeInTheDocument();
    });

    it('replaces the skeleton with the pills once market data arrives', () => {
      renderRail();

      expect(
        screen.getByTestId('perps-market-categories-pill-crypto'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('perps-market-categories-skeleton'),
      ).not.toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('marks the active category as pressed', () => {
      renderRail({ selectedCategory: 'stock' });

      expect(
        screen.getByTestId('perps-market-categories-pill-stock'),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(
        screen.getByTestId('perps-market-categories-pill-crypto'),
      ).toHaveAttribute('aria-pressed', 'false');
    });

    it('selects a category when its pill is pressed', async () => {
      const onSelect = jest.fn();
      const onClear = jest.fn();

      renderRail({ onSelect, onClear });

      await userEvent.click(
        screen.getByTestId('perps-market-categories-pill-forex'),
      );

      expect(onSelect).toHaveBeenCalledWith('forex');
      expect(onClear).not.toHaveBeenCalled();
    });

    it('clears the filter when the active category is pressed again', async () => {
      const onClear = jest.fn();
      const onSelect = jest.fn();

      renderRail({ selectedCategory: 'stock', onClear, onSelect });

      await userEvent.click(
        screen.getByTestId('perps-market-categories-pill-stock'),
      );

      expect(onClear).toHaveBeenCalledTimes(1);
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('announces the rail as a named group', () => {
      renderRail();

      const rail = screen.getByTestId('perps-market-categories');

      expect(rail).toHaveAttribute('role', 'group');
      expect(rail).toHaveAttribute(
        'aria-label',
        messages.perpsMarketCategories.message,
      );
    });

    it('names the active pill as the control that clears the filter', () => {
      renderRail({ selectedCategory: 'stock' });

      expect(
        screen.getByTestId('perps-market-categories-pill-stock'),
      ).toHaveAccessibleName(
        `${messages.perpsFilterStocks.message}, clear filter`,
      );
    });

    it('reaches every pill from the keyboard', async () => {
      renderRail();

      // Nothing is behind an extra interaction, so one Tab per pill walks the
      // whole rail — the property the removed overflow menu could not offer.
      for (const category of CATEGORIES) {
        await userEvent.tab();
        expect(
          screen.getByTestId(`perps-market-categories-pill-${category}`),
        ).toHaveFocus();
      }
    });
  });
});
