import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { usePerpsLiveMarketListData } from '../../../../hooks/perps/stream';
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

jest.mock('../../../../hooks/perps/stream', () => ({
  usePerpsLiveMarketListData: jest.fn(),
}));

const mockTrack = jest.fn();

jest.mock('../../../../hooks/perps', () => ({
  ...jest.requireActual('../../../../hooks/perps'),
  usePerpsEventTracking: () => ({ track: mockTrack }),
}));

const mockUsePerpsLiveMarketListData = jest.mocked(usePerpsLiveMarketListData);

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

const setLiveMarkets = (
  markets: PerpsMarketData[],
  isInitialLoading = false,
) => {
  mockUsePerpsLiveMarketListData.mockReturnValue({
    markets,
    isInitialLoading,
  } as ReturnType<typeof usePerpsLiveMarketListData>);
};

const renderSection = () => renderWithProvider(<PerpsTopMovers />, mockStore);

const getPillSymbols = () =>
  screen
    .getAllByTestId(/^perps-top-movers-pill-/u)
    .map((pill) => pill.dataset.testid?.replace('perps-top-movers-pill-', ''));

describe('PerpsTopMovers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setLiveMarkets(MARKETS);
  });

  describe('rendering', () => {
    it('renders the top movers section', () => {
      renderSection();

      expect(screen.getByTestId('perps-top-movers')).toBeInTheDocument();
    });

    it('renders the gainers and losers toggle', () => {
      renderSection();

      expect(
        screen.getByTestId('perps-top-movers-gainers'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('perps-top-movers-losers')).toBeInTheDocument();
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

    it('ranks the biggest risers first while gainers is selected', () => {
      renderSection();

      expect(getPillSymbols()).toStrictEqual(['ETH', 'BTC', 'SOL']);
    });

    it('renders one pill per ranked market', () => {
      renderSection();

      expect(screen.getByTestId('perps-top-movers-list')).toBeInTheDocument();
      expect(getPillSymbols()).toHaveLength(MARKETS.length);
    });

    it('caps the pill grid at the top movers limit', () => {
      setLiveMarkets(
        Array.from(
          { length: PERPS_CONSTANTS.TOP_MOVERS_LIMIT + 4 },
          (_, index) => createMarket(`SYM${index}`, `+${index}.00%`),
        ),
      );
      renderSection();

      expect(getPillSymbols()).toHaveLength(PERPS_CONSTANTS.TOP_MOVERS_LIMIT);
    });

    it('renders the loading skeleton while market data is loading', () => {
      setLiveMarkets([], true);
      renderSection();

      expect(
        screen.getByTestId('perps-top-movers-skeleton'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('perps-top-movers-list'),
      ).not.toBeInTheDocument();
    });

    it('hides the section when loading finished with no markets', () => {
      setLiveMarkets([]);
      renderSection();

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

    it('returns to the risers ranking when gainers is selected again', () => {
      renderSection();

      fireEvent.click(screen.getByTestId('perps-top-movers-losers'));
      fireEvent.click(screen.getByTestId('perps-top-movers-gainers'));

      expect(getPillSymbols()).toStrictEqual(['ETH', 'BTC', 'SOL']);
    });
  });

  describe('navigation', () => {
    it('opens the market list sorted by descending price change from the header', () => {
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

    it('attributes a pill tap to the losers section after switching direction', () => {
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
