import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import type { MarketFilter } from '../../../../../shared/constants/perps';
import {
  PerpsCategoryRail,
  PerpsCategoryRailLayout,
  SKELETON_PILL_COUNT,
} from './perps-category-rail';
import { RAIL_GAP_PX } from './use-category-rail-overflow';

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

/** Every pill is given the same width, so fit maths stays readable in a test. */
const PILL_WIDTH = 80;

/**
 * jsdom lays nothing out, so every measured box reports 0 and the overflow rail
 * would never resolve a fit. These stubs give the row a width and each item a
 * width, which is the whole input the fit calculation takes.
 *
 * @param railWidth - Content width available to the row, in pixels.
 * @returns A teardown that restores the real (zero) geometry.
 */
const mockRailGeometry = (railWidth: number) => {
  const offsetWidth = jest
    .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
    .mockImplementation(function getWidth(this: HTMLElement) {
      return (this.dataset.testid ?? '').includes('-item-') ? PILL_WIDTH : 0;
    });
  const clientWidth = jest
    .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
    .mockImplementation(function getWidth(this: HTMLElement) {
      // Only the pill row is measured; the More trigger is its sibling, so the
      // row a test hands here is already the space left for pills.
      return this.dataset.testid === 'perps-market-categories-row'
        ? railWidth
        : 0;
    });
  return () => {
    offsetWidth.mockRestore();
    clientWidth.mockRestore();
  };
};

/**
 * Width that fits `count` pills exactly, with no room for anything else.
 *
 * @param count - How many pills should fit.
 * @returns The row width in pixels.
 */
const widthForPills = (count: number) =>
  count * PILL_WIDTH + (count - 1) * RAIL_GAP_PX;

describe('PerpsCategoryRail', () => {
  let restoreGeometry: (() => void) | undefined;

  afterEach(() => {
    restoreGeometry?.();
    restoreGeometry = undefined;
    jest.clearAllMocks();
  });

  describe('wrap layout', () => {
    const renderWrapped = (
      props: Partial<React.ComponentProps<typeof PerpsCategoryRail>> = {},
    ) => renderRail({ layout: PerpsCategoryRailLayout.Wrap, ...props });

    it('renders every category as a pill, in the given order', () => {
      renderWrapped();

      expect(pillCategories()).toStrictEqual(CATEGORIES);
    });

    it('wraps the pills instead of hiding any of them', () => {
      renderWrapped();

      const rail = screen.getByTestId('perps-market-categories');

      // Wrapping is what keeps every category on screen: neither a horizontal
      // scroller nor an overflow menu may take its place.
      expect(rail).toHaveClass('flex-wrap');
      expect(rail).not.toHaveClass('overflow-x-auto');
      expect(
        screen.queryByTestId('perps-market-categories-more-button'),
      ).not.toBeInTheDocument();
    });

    it('never moves a category into a menu, however narrow the rail', () => {
      restoreGeometry = mockRailGeometry(widthForPills(2));

      renderWrapped();

      expect(pillCategories()).toStrictEqual(CATEGORIES);
      expect(
        screen.queryByTestId('perps-market-categories-more-button'),
      ).not.toBeInTheDocument();
    });

    it('renders nothing when there are no categories', () => {
      renderWrapped({ categories: [] });

      expect(
        screen.queryByTestId('perps-market-categories'),
      ).not.toBeInTheDocument();
    });
  });

  describe('overflow layout', () => {
    it('shows no overflow menu when every category fits', async () => {
      // A wider extension window: room for all seven pills.
      restoreGeometry = mockRailGeometry(widthForPills(CATEGORIES.length));

      renderRail();

      await waitFor(() => {
        expect(pillCategories()).toStrictEqual(CATEGORIES);
      });
      expect(
        screen.queryByTestId('perps-market-categories-more-button'),
      ).not.toBeInTheDocument();
    });

    it('moves the categories that do not fit into the More menu', async () => {
      // A popup-width rail: room for three pills plus the More trigger.
      restoreGeometry = mockRailGeometry(widthForPills(3));

      renderRail();

      await waitFor(() => {
        expect(pillCategories()).toStrictEqual(['crypto', 'stock', 'pre-ipo']);
      });
      expect(
        screen.getByTestId('perps-market-categories-more-button'),
      ).toHaveTextContent(messages.perpsFilterMore.message);
    });

    it('never scrolls the row horizontally', async () => {
      restoreGeometry = mockRailGeometry(widthForPills(2));

      renderRail();

      const row = await screen.findByTestId('perps-market-categories-row');

      expect(row).toHaveClass('overflow-x-clip');
      expect(row).not.toHaveClass('overflow-x-auto');
    });

    it('selects a category chosen from the More menu', async () => {
      restoreGeometry = mockRailGeometry(widthForPills(2));
      const onSelect = jest.fn();

      renderRail({ onSelect });

      fireEvent.click(
        await screen.findByTestId('perps-market-categories-more-button'),
      );
      fireEvent.click(
        await screen.findByTestId('perps-market-categories-more-option-forex'),
      );

      expect(onSelect).toHaveBeenCalledWith('forex');
    });

    it('keeps the given order instead of promoting the active category', async () => {
      restoreGeometry = mockRailGeometry(widthForPills(2));

      renderRail({ selectedCategory: 'forex', onClear: jest.fn() });

      // Figma 12608:47548 splits the rail at the fit boundary in source order:
      // the selected pill only grows by its clear icon, it does not move.
      await waitFor(() => {
        expect(pillCategories()).toStrictEqual(['crypto', 'stock']);
      });
    });

    it('carries the selection into the menu when the active category overflows', async () => {
      restoreGeometry = mockRailGeometry(widthForPills(2));

      renderRail({ selectedCategory: 'forex', onClear: jest.fn() });

      fireEvent.click(
        await screen.findByTestId('perps-market-categories-more-button'),
      );

      // The filter in force stays visible even from inside the menu.
      expect(
        await screen.findByTestId('perps-market-categories-more-option-forex'),
      ).toHaveAttribute('aria-selected', 'true');
    });

    it('marks the More trigger as holding the selection when it overflows', async () => {
      restoreGeometry = mockRailGeometry(widthForPills(2));

      renderRail({ selectedCategory: 'forex', onClear: jest.fn() });

      const trigger = await screen.findByTestId(
        'perps-market-categories-more-button',
      );

      // Without this the rail would show no active filter at all while one is
      // in force, because the pill carrying it is inside the menu.
      expect(trigger).toHaveClass('bg-icon-default');
      expect(trigger).toHaveAccessibleName(
        `More, ${messages.perpsFilterForex.message} selected`,
      );
    });

    it('leaves the More trigger unmarked while the selection is on the rail', async () => {
      restoreGeometry = mockRailGeometry(widthForPills(2));

      renderRail({ selectedCategory: 'crypto', onClear: jest.fn() });

      const trigger = await screen.findByTestId(
        'perps-market-categories-more-button',
      );

      expect(trigger).not.toHaveClass('bg-icon-default');
      expect(trigger).toHaveTextContent(messages.perpsFilterMore.message);
    });

    it('clears the filter when the overflowed active category is chosen again', async () => {
      restoreGeometry = mockRailGeometry(widthForPills(2));
      const onClear = jest.fn();
      const onSelect = jest.fn();

      renderRail({ selectedCategory: 'forex', onClear, onSelect });

      fireEvent.click(
        await screen.findByTestId('perps-market-categories-more-button'),
      );
      fireEvent.click(
        await screen.findByTestId('perps-market-categories-more-option-forex'),
      );

      expect(onClear).toHaveBeenCalledTimes(1);
      expect(onSelect).not.toHaveBeenCalled();
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

  describe('navigate-only rail', () => {
    it('reports no pressed state when the rail cannot hold a selection', () => {
      // The Perps tab's Products section navigates instead of filtering, so
      // `aria-pressed` would announce a toggle that does not exist.
      renderRail({ onClear: undefined });

      expect(
        screen.getByTestId('perps-market-categories-pill-crypto'),
      ).not.toHaveAttribute('aria-pressed');
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
