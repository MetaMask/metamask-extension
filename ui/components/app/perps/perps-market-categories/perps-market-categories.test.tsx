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
} as Partial<PerpsMarketData>);

const MARKETS = [CRYPTO_MARKET, STOCK_MARKET];

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

    it('keeps the pills on one line so a narrow popup scrolls instead of wrapping', () => {
      renderSection();

      const rail = screen.getByTestId('perps-market-categories');
      const row = screen.getByTestId('perps-market-categories-list');

      expect(rail).toHaveClass('overflow-x-auto');
      expect(rail).not.toHaveClass('px-4');
      expect(row).toHaveClass('w-max', 'flex-nowrap', 'px-4');
      expect(row).not.toHaveClass('flex-wrap');
    });

    it('hides the rail when loading finished with no markets', () => {
      renderSection([]);

      expect(
        screen.queryByTestId('perps-market-categories'),
      ).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('renders the skeleton rail at the loaded rail height while market data loads', () => {
      const { unmount } = renderSection([], true);
      const skeletonPills = Array.from(
        screen.getByTestId('perps-market-categories-skeleton').children,
      );

      expect(skeletonPills.length).toBeGreaterThan(0);
      skeletonPills.forEach((pill) => expect(pill).toHaveClass('h-8'));
      expect(
        screen.queryByTestId('perps-market-categories-list'),
      ).not.toBeInTheDocument();

      unmount();
      renderSection();

      expect(
        screen.getByTestId('perps-market-categories-pill-crypto'),
      ).toHaveClass('h-8');
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
