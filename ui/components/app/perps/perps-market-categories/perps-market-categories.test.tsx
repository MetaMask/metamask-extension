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
import type { PerpsMarketData } from '../types';
import { PerpsMarketCategories } from './perps-market-categories';

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
  overrides: Partial<PerpsMarketData> = {},
): PerpsMarketData =>
  ({
    symbol,
    name: symbol,
    maxLeverage: '20x',
    price: '$1.00',
    change24h: '+$0.00',
    change24hPercent: '+1.00%',
    volume: '$1M',
    ...overrides,
  }) as PerpsMarketData;

/** Main-DEX asset: no `marketSource`, so the controller buckets it as crypto. */
const CRYPTO_MARKET = createMarket('BTC');

/** HIP-3 asset carrying an explicit data-model category. */
const STOCK_MARKET = createMarket('xyz:TSLA', {
  marketSource: 'xyz',
  isHip3: true,
  marketType: 'stock',
});

const MARKETS = [CRYPTO_MARKET, STOCK_MARKET];

/**
 * The rail reserves a fixed footprint while loading: this many skeleton pills at
 * the real pill's height, so nothing below the rail shifts when the categories
 * arrive. Both loading tests pin these, so a changed footprint fails loudly.
 */
const SKELETON_PILL_COUNT = 5;
const PILL_HEIGHT = 'h-8';

const renderSection = (markets = MARKETS, isLoading = false) =>
  renderWithProvider(
    <PerpsMarketCategories markets={markets} isLoading={isLoading} />,
    mockStore,
  );

const getPillCategories = () =>
  screen
    .getAllByTestId(/^perps-market-categories-pill-/u)
    .map((pill) =>
      pill.dataset.testid?.replace('perps-market-categories-pill-', ''),
    );

describe('PerpsMarketCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders one pill per category present in the live markets, All first', () => {
      renderSection();

      expect(getPillCategories()).toStrictEqual(['all', 'crypto', 'stock']);
    });

    it('labels the pills with the shared market filter copy', () => {
      renderSection();

      expect(
        screen.getByTestId('perps-market-categories-pill-all'),
      ).toHaveTextContent(messages.perpsFilterAll.message);
      expect(
        screen.getByTestId('perps-market-categories-pill-crypto'),
      ).toHaveTextContent(messages.perpsFilterCrypto.message);
      expect(
        screen.getByTestId('perps-market-categories-pill-stock'),
      ).toHaveTextContent(messages.perpsFilterStocks.message);
    });

    it('omits a category that no live market falls into', () => {
      renderSection([CRYPTO_MARKET]);

      expect(
        screen.queryByTestId('perps-market-categories-pill-stock'),
      ).not.toBeInTheDocument();
    });

    it('never turns the rail into a horizontal scroller', () => {
      renderSection();

      const row = screen.getByTestId('perps-market-categories-row');

      // Horizontal scroll is the pattern this rail exists to avoid: it hides
      // pills behind a gesture mouse users cannot see coming and keyboard users
      // cannot track focus through. Anything that does not fit goes to the
      // overflow menu instead.
      expect(row).toHaveClass('overflow-x-clip');
      expect(row).not.toHaveClass('overflow-x-auto');
      expect(row).not.toHaveClass('w-max');
    });

    it('hides the rail when loading finished with no markets', () => {
      renderSection([]);

      expect(
        screen.queryByTestId('perps-market-categories'),
      ).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('reserves the rail height with skeleton pills while market data loads', () => {
      renderSection([], true);

      const skeletonPills = Array.from(
        screen.getByTestId('perps-market-categories-skeleton').children,
      );

      expect(skeletonPills).toHaveLength(SKELETON_PILL_COUNT);
      skeletonPills.forEach((pill) => expect(pill).toHaveClass(PILL_HEIGHT));
      expect(
        screen.queryByTestId('perps-market-categories'),
      ).not.toBeInTheDocument();
    });

    it('renders the pills at the reserved skeleton height once market data arrives', () => {
      renderSection();

      expect(
        screen.getByTestId('perps-market-categories-pill-crypto'),
      ).toHaveClass(PILL_HEIGHT);
      expect(
        screen.queryByTestId('perps-market-categories-skeleton'),
      ).not.toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('opens the market list pre-filtered to the pressed category', () => {
      renderSection();

      fireEvent.click(
        screen.getByTestId('perps-market-categories-pill-crypto'),
      );

      expect(mockNavigate).toHaveBeenCalledWith(
        `${PERPS_MARKET_LIST_ROUTE}?filter=crypto`,
      );
    });

    it('opens the unfiltered market list from the All pill', () => {
      renderSection();

      fireEvent.click(screen.getByTestId('perps-market-categories-pill-all'));

      expect(mockNavigate).toHaveBeenCalledWith(
        `${PERPS_MARKET_LIST_ROUTE}?filter=all`,
      );
    });
  });

  describe('accessibility', () => {
    it('announces the rail as a named group of pills', () => {
      renderSection();

      const rail = screen.getByTestId('perps-market-categories');

      expect(rail).toHaveAttribute('role', 'group');
      expect(rail).toHaveAttribute(
        'aria-label',
        messages.perpsMarketCategories.message,
      );
    });

    it('navigates to the filtered market list when a pill is activated from the keyboard', async () => {
      const user = userEvent.setup();
      renderSection();

      await user.tab();
      await user.tab();

      expect(
        screen.getByTestId('perps-market-categories-pill-crypto'),
      ).toHaveFocus();

      await user.keyboard('{Enter}');

      expect(mockNavigate).toHaveBeenCalledWith(
        `${PERPS_MARKET_LIST_ROUTE}?filter=crypto`,
      );
    });
  });

  describe('analytics', () => {
    it('reports the category filter applied from the Perps tab', () => {
      renderSection();

      fireEvent.click(screen.getByTestId('perps-market-categories-pill-stock'));

      expect(mockTrack).toHaveBeenCalledWith(
        MetaMetricsEventName.PerpsUiInteraction,
        {
          [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
            PERPS_EVENT_VALUE.INTERACTION_TYPE.FILTER_APPLIED,
          [PERPS_EVENT_PROPERTY.FILTER_CATEGORY]: 'stock',
          [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
            PERPS_EVENT_VALUE.BUTTON_LOCATION.PERPS_HOME,
        },
      );
    });
  });
});
