import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import type { MarketFilter } from '../../../../../shared/constants/perps';
import { PerpsCategoryRail } from './perps-category-rail';
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

/** Every pill is given the same width, so fit maths stays readable in a test. */
const PILL_WIDTH = 80;

/**
 * jsdom lays nothing out, so every measured box reports 0 and the rail would
 * never resolve an overflow. These stubs give the row a width and each item a
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
 * @param count
 */
const widthForPills = (count: number) =>
  count * PILL_WIDTH + (count - 1) * RAIL_GAP_PX;

const renderRail = (
  props: Partial<React.ComponentProps<typeof PerpsCategoryRail>> = {},
) =>
  renderWithProvider(
    <PerpsCategoryRail
      categories={CATEGORIES}
      onSelect={jest.fn()}
      ariaLabel={messages.perpsMarketCategories.message}
      {...props}
    />,
    mockStore,
  );

const visiblePillCategories = () =>
  screen
    .getAllByTestId(/^perps-market-categories-pill-/u)
    .map((pill) =>
      pill.dataset.testid?.replace('perps-market-categories-pill-', ''),
    );

describe('PerpsCategoryRail', () => {
  let restoreGeometry: (() => void) | undefined;

  afterEach(() => {
    restoreGeometry?.();
    restoreGeometry = undefined;
    jest.clearAllMocks();
  });

  describe('overflow', () => {
    it('shows no overflow menu when every category fits', async () => {
      // An expanded window: the rail is wide enough for all seven pills.
      restoreGeometry = mockRailGeometry(widthForPills(CATEGORIES.length));

      renderRail();

      await waitFor(() => {
        expect(visiblePillCategories()).toStrictEqual(CATEGORIES);
      });
      expect(
        screen.queryByTestId('perps-market-categories-more-button'),
      ).not.toBeInTheDocument();
    });

    it('moves the categories that do not fit into the overflow menu', async () => {
      // A popup-width rail: room for three pills plus the More trigger.
      restoreGeometry = mockRailGeometry(widthForPills(3));

      renderRail();

      await waitFor(() => {
        expect(visiblePillCategories()).toStrictEqual([
          'crypto',
          'stock',
          'pre-ipo',
        ]);
      });
      expect(
        screen.getByTestId('perps-market-categories-more-button'),
      ).toHaveTextContent(messages.perpsFilterMore.message);
    });

    it('never scrolls the rail horizontally', async () => {
      restoreGeometry = mockRailGeometry(widthForPills(2));

      renderRail();

      const row = await screen.findByTestId('perps-market-categories-row');

      expect(row).toHaveClass('overflow-x-clip');
      expect(row).not.toHaveClass('overflow-x-auto');
    });

    it('selects a category chosen from the overflow menu', async () => {
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

    it('keeps the active category visible when it would otherwise overflow', async () => {
      restoreGeometry = mockRailGeometry(widthForPills(2));

      renderRail({ selectedCategory: 'forex', onClear: jest.fn() });

      // Forex sits last in the source order, so without promotion it would be
      // hidden behind the More menu while it is the filter in force.
      await waitFor(() => {
        expect(visiblePillCategories()[0]).toBe('forex');
      });
      expect(
        screen.getByTestId('perps-market-categories-pill-forex'),
      ).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('selection', () => {
    it('marks the active category as pressed', () => {
      renderRail({ selectedCategory: 'stock', onClear: jest.fn() });

      expect(
        screen.getByTestId('perps-market-categories-pill-stock'),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(
        screen.getByTestId('perps-market-categories-pill-crypto'),
      ).toHaveAttribute('aria-pressed', 'false');
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

    it('reports no pressed state on a rail that cannot hold a selection', () => {
      // The Perps tab navigates instead of filtering, so `aria-pressed` would
      // announce a toggle that does not exist.
      renderRail();

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
      renderRail({ selectedCategory: 'stock', onClear: jest.fn() });

      expect(
        screen.getByTestId('perps-market-categories-pill-stock'),
      ).toHaveAccessibleName(
        `${messages.perpsFilterStocks.message}, clear filter`,
      );
    });
  });
});
