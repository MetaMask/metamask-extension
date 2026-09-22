import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import {
  PERPS_MARKET_DETAIL_ROUTE,
  PERPS_MARKET_LIST_ROUTE,
} from '../../../../helpers/constants/routes';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import { PERPS_CONSTANTS } from '../constants';
import type { PerpsMarketData } from '../types';
import { PerpsTopMovers } from './perps-top-movers';

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

const createMarket = (
  symbol: string,
  change24hPercent: string,
): PerpsMarketData =>
  ({
    symbol,
    name: symbol,
    maxLeverage: '20x',
    price: '$1.00',
    change24h: '+$0.00',
    change24hPercent,
    volume: '$1M',
  }) as PerpsMarketData;

const MARKETS = [
  createMarket('BTC', '+1.00%'),
  createMarket('ETH', '+9.00%'),
  createMarket('SOL', '-4.00%'),
];

const renderSection = (markets = MARKETS, isLoading = false) =>
  renderWithProvider(
    <PerpsTopMovers markets={markets} isLoading={isLoading} />,
    mockStore,
  );

const getPillSymbols = () =>
  screen
    .getAllByTestId(/^perps-top-movers-pill-/u)
    .map((pill) => pill.dataset.testid?.replace('perps-top-movers-pill-', ''));

describe('PerpsTopMovers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders the top movers section', () => {
      renderSection();

      expect(screen.getByTestId('perps-top-movers')).toBeInTheDocument();
    });

    it('displays the section heading copy', () => {
      renderSection();

      expect(screen.getByTestId('perps-top-movers-header')).toHaveTextContent(
        messages.perpsTopMovers.message,
      );
    });

    it('displays the toggle copy on both directions', () => {
      renderSection();

      expect(screen.getByTestId('perps-top-movers-gainers')).toHaveTextContent(
        messages.perpsTopMoversGainers.message,
      );
      expect(screen.getByTestId('perps-top-movers-losers')).toHaveTextContent(
        messages.perpsTopMoversLosers.message,
      );
    });

    it('selects gainers by default', () => {
      renderSection();

      expect(screen.getByTestId('perps-top-movers-gainers')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByTestId('perps-top-movers-losers')).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('keeps the bordered toggle track inset from the screen edges', () => {
      renderSection();

      const track = screen.getByTestId('perps-top-movers-toggle');

      expect(track).toHaveClass('p-1');
      expect(track).not.toHaveClass('pl-4');
      expect(track).not.toHaveClass('pr-4');
      expect(track.parentElement).toHaveClass('pl-4', 'pr-4');
    });

    it('stacks the ranked pills as a two-column grid', () => {
      renderSection(
        Array.from({ length: PERPS_CONSTANTS.TOP_MOVERS_LIMIT }, (_, index) =>
          createMarket(`SYM${index}`, `+${index}.00%`),
        ),
      );

      const list = screen.getByTestId('perps-top-movers-list');

      expect(list).toHaveClass('grid', 'grid-cols-2');
      expect(list.childElementCount).toBe(PERPS_CONSTANTS.TOP_MOVERS_LIMIT);
    });

    it('never puts the pills in a sideways scroller a desktop cannot slide', () => {
      renderSection(
        Array.from({ length: PERPS_CONSTANTS.TOP_MOVERS_LIMIT }, (_, index) =>
          createMarket(`SYM${index}`, `+${index}.00%`),
        ),
      );

      const list = screen.getByTestId('perps-top-movers-list');

      expect(list).not.toHaveClass('overflow-x-auto');
      expect(list).not.toHaveClass('w-max');
      expect(list).not.toHaveClass('flex-nowrap');
      expect(
        screen.queryByTestId('perps-top-movers-list-row-0'),
      ).not.toBeInTheDocument();
    });

    it('gives every pill the full width of its grid cell', () => {
      renderSection();

      screen.getAllByTestId(/^perps-top-movers-pill-/u).forEach((pill) => {
        expect(pill).toHaveClass('w-full');
        expect(pill).not.toHaveClass('w-auto');
        expect(pill).not.toHaveClass('shrink-0');
      });
    });

    it('keeps the ranking order across the grid', () => {
      renderSection([
        createMarket('AAA', '+9.00%'),
        createMarket('BBB', '+5.00%'),
        createMarket('CCC', '+1.00%'),
      ]);

      expect(getPillSymbols()).toStrictEqual(['AAA', 'BBB', 'CCC']);
    });

    it('renders a stacked two-column skeleton grid while market data loads', () => {
      renderSection([], true);

      const skeleton = screen.getByTestId('perps-top-movers-skeleton');

      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('grid', 'grid-cols-2');
      // One placeholder per ranked slot, so the section does not reflow when
      // the live ranking lands.
      expect(skeleton.childElementCount).toBe(PERPS_CONSTANTS.TOP_MOVERS_LIMIT);
      // ...each the same 36px a real pill measures. A shorter placeholder makes
      // the whole section jump upward the moment the ranking lands, which is the
      // reflow this skeleton exists to prevent. `PerpsTopMoverPill` keeps its
      // half of this contract via the `h-auto`/`py-1.5` assertion in
      // perps-top-mover-pill.test.tsx.
      Array.from(skeleton.children).forEach((placeholder) => {
        expect(placeholder).toHaveClass('h-9', 'w-full');
      });
      expect(skeleton).not.toHaveClass('overflow-x-auto');
      expect(
        screen.queryByTestId('perps-top-movers-list'),
      ).not.toBeInTheDocument();
    });

    it('hides the section when loading finished with no markets', () => {
      renderSection([]);

      expect(screen.queryByTestId('perps-top-movers')).not.toBeInTheDocument();
    });
  });

  describe('direction toggle', () => {
    it('re-ranks the pills to the biggest fallers when losers is selected', () => {
      renderSection();

      fireEvent.click(screen.getByTestId('perps-top-movers-losers'));

      expect(getPillSymbols()).toStrictEqual(['SOL', 'BTC', 'ETH']);
    });

    it('moves the pressed state onto losers when losers is selected', () => {
      renderSection();

      fireEvent.click(screen.getByTestId('perps-top-movers-losers'));

      expect(screen.getByTestId('perps-top-movers-losers')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByTestId('perps-top-movers-gainers')).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('keeps the pill grid mounted through a direction change', () => {
      renderSection();

      fireEvent.click(screen.getByTestId('perps-top-movers-losers'));

      expect(screen.getByTestId('perps-top-movers-list')).toBeInTheDocument();
      expect(
        screen.queryByTestId('perps-top-movers-skeleton'),
      ).not.toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('opens the market list pre-sorted by descending price change', () => {
      renderSection();

      fireEvent.click(screen.getByTestId('perps-top-movers-header'));

      expect(mockNavigate).toHaveBeenCalledWith(
        `${PERPS_MARKET_LIST_ROUTE}?sort=priceChange&direction=desc`,
      );
    });

    it('carries the losers direction into the market list sort', () => {
      renderSection();

      fireEvent.click(screen.getByTestId('perps-top-movers-losers'));
      fireEvent.click(screen.getByTestId('perps-top-movers-header'));

      expect(mockNavigate).toHaveBeenCalledWith(
        `${PERPS_MARKET_LIST_ROUTE}?sort=priceChange&direction=asc`,
      );
    });

    it('opens the market detail page from a pill', () => {
      renderSection();

      fireEvent.click(screen.getByTestId('perps-top-movers-pill-ETH'));

      expect(mockNavigate).toHaveBeenCalledWith(
        `${PERPS_MARKET_DETAIL_ROUTE}/ETH`,
      );
    });
  });

  describe('analytics', () => {
    it('reports the top movers header click', () => {
      renderSection();

      fireEvent.click(screen.getByTestId('perps-top-movers-header'));

      expect(mockTrack).toHaveBeenCalledWith(
        MetaMetricsEventName.PerpsUiInteraction,
        {
          [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
            PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
          [PERPS_EVENT_PROPERTY.BUTTON_CLICKED]:
            PERPS_EVENT_VALUE.BUTTON_CLICKED.TOP_MOVERS,
          [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
            PERPS_EVENT_VALUE.BUTTON_LOCATION.PERPS_HOME,
        },
      );
    });

    it('attributes a pill tap to the gainers section', () => {
      renderSection();

      fireEvent.click(screen.getByTestId('perps-top-movers-pill-ETH'));

      expect(mockTrack).toHaveBeenCalledWith(
        MetaMetricsEventName.PerpsUiInteraction,
        {
          [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
            PERPS_EVENT_VALUE.INTERACTION_TYPE.TAP,
          [PERPS_EVENT_PROPERTY.ASSET]: 'ETH',
          [PERPS_EVENT_PROPERTY.SOURCE_SECTION]:
            PERPS_EVENT_VALUE.SOURCE_SECTION.TOP_GAINERS,
        },
      );
    });

    it('attributes a pill tap to the losers section', () => {
      renderSection();

      fireEvent.click(screen.getByTestId('perps-top-movers-losers'));
      fireEvent.click(screen.getByTestId('perps-top-movers-pill-SOL'));

      expect(mockTrack).toHaveBeenCalledWith(
        MetaMetricsEventName.PerpsUiInteraction,
        {
          [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
            PERPS_EVENT_VALUE.INTERACTION_TYPE.TAP,
          [PERPS_EVENT_PROPERTY.ASSET]: 'SOL',
          [PERPS_EVENT_PROPERTY.SOURCE_SECTION]:
            PERPS_EVENT_VALUE.SOURCE_SECTION.TOP_LOSERS,
        },
      );
    });
  });
});
