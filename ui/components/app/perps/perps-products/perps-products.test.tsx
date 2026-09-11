import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { PERPS_MARKET_LIST_ROUTE } from '../../../../helpers/constants/routes';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import { PERPS_PRODUCT_CATEGORIES } from '../constants';
import { SKELETON_PILL_COUNT } from '../perps-market-categories/perps-category-rail';
import { PerpsProducts } from './perps-products';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockTrack = jest.fn();

jest.mock('../../../../hooks/perps', () => ({
  ...jest.requireActual('../../../../hooks/perps'),
  usePerpsEventTracking: () => ({ track: mockTrack }),
}));

const mockStore = configureStore({ metamask: { ...mockState.metamask } });

const renderSection = (isLoading = false) =>
  renderWithProvider(<PerpsProducts isLoading={isLoading} />, mockStore);

const getChipCategories = () =>
  screen
    .getAllByTestId(/^perps-products-categories-pill-/u)
    .map((chip) =>
      chip.dataset.testid?.replace('perps-products-categories-pill-', ''),
    );

describe('PerpsProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('titles the section Products', () => {
      renderSection();

      expect(
        screen.getByText(messages.perpsProducts.message),
      ).toBeInTheDocument();
    });

    it('renders a chip for every category in the design', () => {
      renderSection();

      expect(getChipCategories()).toStrictEqual([...PERPS_PRODUCT_CATEGORIES]);
    });

    it('orders the chips as the Products design does, not as the controller does', () => {
      // `commodity` before `index`, and `new` interleaved before `forex` — the
      // controller's own order disagrees on both.
      expect(PERPS_PRODUCT_CATEGORIES).toStrictEqual([
        'crypto',
        'stock',
        'pre-ipo',
        'commodity',
        'index',
        'new',
        'forex',
        'etf',
      ]);
    });

    it('labels the chips with the shared market filter copy', () => {
      renderSection();

      expect(
        screen.getByTestId('perps-products-categories-pill-crypto'),
      ).toHaveTextContent(messages.perpsFilterCrypto.message);
      expect(
        screen.getByTestId('perps-products-categories-pill-stock'),
      ).toHaveTextContent(messages.perpsFilterStocks.message);
    });

    it('wraps the chips instead of hiding any of them', () => {
      renderSection();

      const rail = screen.getByTestId('perps-products-categories');

      expect(rail).toHaveClass('flex-wrap');
      expect(rail).not.toHaveClass('overflow-x-auto');
      expect(
        screen.queryByTestId('perps-products-categories-more-button'),
      ).not.toBeInTheDocument();
    });

    it('gives every chip its leading glyph', () => {
      renderSection();

      for (const category of getChipCategories()) {
        expect(
          screen
            .getByTestId(`perps-products-categories-pill-${category}`)
            .querySelector('svg'),
        ).toBeInTheDocument();
      }
    });
  });

  describe('loading state', () => {
    it('reserves the section height with skeleton chips while market data loads', () => {
      renderSection(true);

      expect(
        screen.getByTestId('perps-products-categories-skeleton').children,
      ).toHaveLength(SKELETON_PILL_COUNT);
      expect(
        screen.queryByTestId('perps-products-categories'),
      ).not.toBeInTheDocument();
    });

    it('renders the chips once market data arrives', () => {
      renderSection();

      expect(
        screen.getByTestId('perps-products-categories-pill-crypto'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('perps-products-categories-skeleton'),
      ).not.toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('opens the market list pre-filtered to the pressed category', () => {
      renderSection();

      fireEvent.click(
        screen.getByTestId('perps-products-categories-pill-stock'),
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        `${PERPS_MARKET_LIST_ROUTE}?filter=stock`,
      );
    });

    it('navigates from the keyboard as it does from a click', async () => {
      renderSection();

      await userEvent.tab();
      await userEvent.keyboard('{Enter}');

      expect(
        screen.getByTestId('perps-products-categories-pill-crypto'),
      ).toHaveFocus();
      expect(mockNavigate).toHaveBeenCalledWith(
        `${PERPS_MARKET_LIST_ROUTE}?filter=crypto`,
      );
    });
  });

  describe('accessibility', () => {
    it('announces the chips as a named group', () => {
      renderSection();

      const rail = screen.getByTestId('perps-products-categories');

      expect(rail).toHaveAttribute('role', 'group');
      expect(rail).toHaveAttribute(
        'aria-label',
        messages.perpsProducts.message,
      );
    });

    it('claims no pressed state, because a chip navigates rather than toggles', () => {
      renderSection();

      expect(
        screen.getByTestId('perps-products-categories-pill-crypto'),
      ).not.toHaveAttribute('aria-pressed');
    });
  });

  describe('analytics', () => {
    it('reports the category filter applied from the Perps tab', () => {
      renderSection();

      fireEvent.click(
        screen.getByTestId('perps-products-categories-pill-crypto'),
      );

      expect(mockTrack).toHaveBeenCalledWith(
        MetaMetricsEventName.PerpsUiInteraction,
        {
          [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
            PERPS_EVENT_VALUE.INTERACTION_TYPE.FILTER_APPLIED,
          [PERPS_EVENT_PROPERTY.FILTER_CATEGORY]: 'crypto',
          [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
            PERPS_EVENT_VALUE.BUTTON_LOCATION.PERPS_HOME,
        },
      );
    });
  });
});
