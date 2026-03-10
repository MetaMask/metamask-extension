import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import * as mocks from './mocks';
import { PerpsTabView } from './perps-tab-view';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../providers/perps', () => ({
  getPerpsStreamManager: () => ({
    init: jest.fn().mockResolvedValue(undefined),
    prewarm: jest.fn(),
    cleanupPrewarm: jest.fn(),
  }),
  usePerpsController: () => ({
    messenger: {
      subscribe: jest.fn(() => jest.fn()),
    },
  }),
}));

// Mock the perps stream hooks
jest.mock('../../../hooks/perps/stream', () => ({
  usePerpsLivePositions: () => ({
    positions: mocks.mockPositions,
    isInitialLoading: false,
  }),
  usePerpsLiveOrders: () => ({
    orders: mocks.mockOrders,
    isInitialLoading: false,
  }),
  usePerpsLiveAccount: () => ({
    account: mocks.mockAccountState,
    isInitialLoading: false,
  }),
  usePerpsLiveMarketData: () => ({
    markets: [...mocks.mockCryptoMarkets, ...mocks.mockHip3Markets],
    cryptoMarkets: mocks.mockCryptoMarkets,
    hip3Markets: mocks.mockHip3Markets,
    isInitialLoading: false,
  }),
}));

jest.mock('./withdraw-funds-modal', () => ({
  WithdrawFundsModal: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="perps-withdraw-modal-state">
      {isOpen ? 'open' : 'closed'}
    </div>
  ),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('PerpsTabView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with default mock data (positions and orders)', () => {
    it('renders the perps tab view', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      expect(screen.getByTestId('perps-tab-view')).toBeInTheDocument();
    });

    it('renders the balance dropdown', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      expect(screen.getByTestId('perps-balance-dropdown')).toBeInTheDocument();
    });

    it('shows positions section when mock positions exist', () => {
      // Default mocks have positions
      expect(mocks.mockPositions.length).toBeGreaterThan(0);

      renderWithProvider(<PerpsTabView />, mockStore);

      expect(screen.getByTestId('perps-positions-section')).toBeInTheDocument();
    });

    it('shows orders section when mock orders exist', () => {
      // Default mocks have orders
      expect(mocks.mockOrders.length).toBeGreaterThan(0);

      renderWithProvider(<PerpsTabView />, mockStore);

      expect(screen.getByTestId('perps-orders-section')).toBeInTheDocument();
    });

    it('shows explore markets section', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      expect(
        screen.getByTestId('perps-explore-markets-row'),
      ).toBeInTheDocument();
    });

    it('renders position cards for each position', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      // Check that at least the first position is rendered
      expect(screen.getByTestId('position-card-ETH')).toBeInTheDocument();
    });

    it('renders order cards for each order', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      // Check that at least the first order is rendered
      expect(screen.getByTestId('order-card-order-001')).toBeInTheDocument();
    });

    it('displays position section header', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      expect(screen.getByText(/positions/iu)).toBeInTheDocument();
    });

    it('displays orders section header', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      expect(screen.getByText(/open orders/iu)).toBeInTheDocument();
    });

    it('displays close all option in positions section', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      const closeAllElements = screen.getAllByText(/close all/iu);
      expect(closeAllElements.length).toBeGreaterThanOrEqual(1);
    });

    it('shows Support & Learn section with Learn basics', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      expect(screen.getByTestId('perps-learn-basics')).toBeInTheDocument();
    });

    it('shows Recent Activity section', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      expect(
        screen.getByTestId('perps-recent-activity-empty'),
      ).toBeInTheDocument();
    });

    it('shows watchlist when mock watchlist symbols match market data', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      expect(screen.getByTestId('perps-watchlist')).toBeInTheDocument();
    });

    it('opens withdraw modal when withdraw is clicked from balance dropdown', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      expect(
        screen.getByTestId('perps-withdraw-modal-state'),
      ).toHaveTextContent('closed');

      fireEvent.click(screen.getByTestId('perps-balance-dropdown-balance'));
      fireEvent.click(screen.getByTestId('perps-balance-dropdown-withdraw'));

      expect(
        screen.getByTestId('perps-withdraw-modal-state'),
      ).toHaveTextContent('open');
    });
  });

  describe('component structure', () => {
    it('renders positions before orders', () => {
      renderWithProvider(<PerpsTabView />, mockStore);

      const positionsSection = screen.getByTestId('perps-positions-section');
      const ordersSection = screen.getByTestId('perps-orders-section');

      // Both should exist
      expect(positionsSection).toBeInTheDocument();
      expect(ordersSection).toBeInTheDocument();

      // Positions should come before orders in the DOM
      const view = screen.getByTestId('perps-tab-view');
      const children = view.querySelectorAll('[data-testid]');
      const childTestIds = Array.from(children).map((child) =>
        child.getAttribute('data-testid'),
      );

      const positionsIndex = childTestIds.indexOf('perps-positions-section');
      const ordersIndex = childTestIds.indexOf('perps-orders-section');

      expect(positionsIndex).toBeLessThan(ordersIndex);
    });
  });
});
