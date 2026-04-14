import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { usePerpsTransactionHistory } from '../../../hooks/perps/usePerpsTransactionHistory';
import * as streamHooks from '../../../hooks/perps/stream';
import * as mocks from './mocks';
import { PerpsView } from './perps-view';

const mockSubmitRequestToBackground = jest.fn().mockResolvedValue(undefined);
const mockGetPerpsStreamManager = jest.fn();

jest.mock('../../../hooks/perps/usePerpsTransactionHistory', () => ({
  usePerpsTransactionHistory: jest.fn(() => ({
    transactions: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}));

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('./perps-toast', () => ({
  PerpsToastProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="perps-toast-provider-mock">{children}</div>
  ),
}));

jest.mock('../../../providers/perps', () => ({
  getPerpsStreamManager: () => mockGetPerpsStreamManager(),
  usePerpsController: () => ({
    messenger: {
      subscribe: jest.fn(() => jest.fn()),
    },
  }),
}));

// Mock the perps stream hooks (jest.fn so individual tests can override return values)
jest.mock('../../../hooks/perps/stream', () => {
  const streamMocks = jest.requireActual<typeof import('./mocks')>('./mocks');
  return {
    usePerpsLivePositions: jest.fn(() => ({
      positions: streamMocks.mockPositions,
      isInitialLoading: false,
    })),
    usePerpsLiveOrders: jest.fn(() => ({
      orders: streamMocks.mockOrders,
      isInitialLoading: false,
    })),
    usePerpsLiveAccount: jest.fn(() => ({
      account: streamMocks.mockAccountState,
      isInitialLoading: false,
    })),
    usePerpsLiveMarketData: jest.fn(() => ({
      markets: [
        ...streamMocks.mockCryptoMarkets,
        ...streamMocks.mockHip3Markets,
      ],
      cryptoMarkets: streamMocks.mockCryptoMarkets,
      hip3Markets: streamMocks.mockHip3Markets,
      isInitialLoading: false,
    })),
  };
});

const mockUsePerpsEligibility = jest.fn(() => ({ isEligible: true }));
jest.mock('../../../hooks/perps/usePerpsEligibility', () => ({
  usePerpsEligibility: () => mockUsePerpsEligibility(),
}));

jest.mock('./perps-tutorial-modal', () => ({
  PerpsTutorialModal: () => null,
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
    isTestnet: false,
    isFirstTimeUser: { testnet: false, mainnet: false },
    watchlistMarkets: {
      testnet: [],
      mainnet: ['BTC', 'ETH'],
    },
  },
});

describe('PerpsView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsEligibility.mockReturnValue({ isEligible: true });
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
    jest.mocked(streamHooks.usePerpsLivePositions).mockReturnValue({
      positions: mocks.mockPositions,
      isInitialLoading: false,
    });
    jest.mocked(streamHooks.usePerpsLiveOrders).mockReturnValue({
      orders: mocks.mockOrders,
      isInitialLoading: false,
    });
    mockGetPerpsStreamManager.mockReturnValue({
      init: jest.fn().mockResolvedValue(undefined),
      prewarm: jest.fn(),
      cleanupPrewarm: jest.fn(),
      clearAllOptimisticTPSL: jest.fn(),
      pushPositionsWithOverrides: jest.fn(),
      orders: { pushData: jest.fn() },
    });
  });

  describe('with default mock data (positions and orders)', () => {
    it('renders the perps tab view', () => {
      renderWithProvider(<PerpsView />, mockStore);

      expect(screen.getByTestId('perps-view')).toBeInTheDocument();
    });

    it('renders the balance dropdown', () => {
      renderWithProvider(<PerpsView />, mockStore);

      expect(screen.getByTestId('perps-balance-dropdown')).toBeInTheDocument();
    });

    it('shows positions section when mock positions exist', () => {
      // Default mocks have positions
      expect(mocks.mockPositions.length).toBeGreaterThan(0);

      renderWithProvider(<PerpsView />, mockStore);

      expect(screen.getByTestId('perps-positions-section')).toBeInTheDocument();
    });

    it('shows orders section when mock orders exist', () => {
      // Default mocks have orders
      expect(mocks.mockOrders.length).toBeGreaterThan(0);

      renderWithProvider(<PerpsView />, mockStore);

      expect(screen.getByTestId('perps-orders-section')).toBeInTheDocument();
    });

    it('shows explore markets section', () => {
      renderWithProvider(<PerpsView />, mockStore);

      expect(
        screen.getByTestId('perps-explore-markets-row'),
      ).toBeInTheDocument();
    });

    it('renders position cards for each position', () => {
      renderWithProvider(<PerpsView />, mockStore);

      // Check that at least the first position is rendered
      expect(screen.getByTestId('position-card-ETH')).toBeInTheDocument();
    });

    it('renders order cards for each order', () => {
      renderWithProvider(<PerpsView />, mockStore);

      // Check that at least the first order is rendered
      expect(screen.getByTestId('order-card-order-001')).toBeInTheDocument();
    });

    it('displays position section header', () => {
      renderWithProvider(<PerpsView />, mockStore);

      expect(screen.getByText(/positions/iu)).toBeInTheDocument();
    });

    it('displays orders section header', () => {
      renderWithProvider(<PerpsView />, mockStore);

      expect(screen.getByText(/open orders/iu)).toBeInTheDocument();
    });

    // TODO: TAT-2852 - Restore when batch close/cancel is implemented
    it('does not display close all option in positions section while hidden', () => {
      renderWithProvider(<PerpsView />, mockStore);

      expect(
        screen.queryByTestId('perps-close-all-positions'),
      ).not.toBeInTheDocument();
    });

    it('shows Support & Learn section with Learn basics', () => {
      renderWithProvider(<PerpsView />, mockStore);

      expect(screen.getByTestId('perps-learn-basics')).toBeInTheDocument();
    });

    it('shows Recent Activity section', () => {
      renderWithProvider(<PerpsView />, mockStore);

      expect(
        screen.getByTestId('perps-recent-activity-empty'),
      ).toBeInTheDocument();
    });

    it('shows Recent Activity list when transaction history has items', () => {
      jest.mocked(usePerpsTransactionHistory).mockReturnValueOnce({
        transactions: mocks.mockTransactions,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderWithProvider(<PerpsView />, mockStore);

      expect(screen.getByTestId('perps-recent-activity')).toBeInTheDocument();
      expect(
        screen.getByTestId('perps-recent-activity-see-all'),
      ).toBeInTheDocument();
    });

    it('filters out order and funding transactions from Recent Activity', () => {
      // mockTransactions contains trades (tx-001, tx-002, tx-002b),
      // a funding entry (tx-003), orders (tx-004 to tx-004d), and a deposit (tx-005)
      jest.mocked(usePerpsTransactionHistory).mockReturnValueOnce({
        transactions: mocks.mockTransactions,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderWithProvider(<PerpsView />, mockStore);

      // Trade and deposit cards should be shown
      expect(screen.getByTestId('transaction-card-tx-001')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-card-tx-005')).toBeInTheDocument();

      // Funding and order cards must not appear in Recent Activity
      expect(
        screen.queryByTestId('transaction-card-tx-003'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('transaction-card-tx-004'),
      ).not.toBeInTheDocument();
    });

    it('shows watchlist when mock watchlist symbols match market data', () => {
      renderWithProvider(<PerpsView />, mockStore);

      expect(screen.getByTestId('perps-watchlist')).toBeInTheDocument();
    });
  });

  describe('component structure', () => {
    it('does not own a PerpsToastProvider wrapper', () => {
      renderWithProvider(<PerpsView />, mockStore);

      expect(
        screen.queryByTestId('perps-toast-provider-mock'),
      ).not.toBeInTheDocument();
    });

    it('renders positions before orders', () => {
      renderWithProvider(<PerpsView />, mockStore);

      const positionsSection = screen.getByTestId('perps-positions-section');
      const ordersSection = screen.getByTestId('perps-orders-section');

      // Both should exist
      expect(positionsSection).toBeInTheDocument();
      expect(ordersSection).toBeInTheDocument();

      // Positions should come before orders in the DOM
      const view = screen.getByTestId('perps-view');
      const children = view.querySelectorAll('[data-testid]');
      const childTestIds = Array.from(children).map((child) =>
        child.getAttribute('data-testid'),
      );

      const positionsIndex = childTestIds.indexOf('perps-positions-section');
      const ordersIndex = childTestIds.indexOf('perps-orders-section');

      expect(positionsIndex).toBeLessThan(ordersIndex);
    });
  });

  // TODO: TAT-2852 - Restore/unskip when batch close/cancel is implemented
  describe('close all and cancel all', () => {
    it.skip('calls batch close and applies a single positions snapshot', async () => {
      const clearAll = jest.fn();
      const pushPositions = jest.fn();
      mockGetPerpsStreamManager.mockReturnValue({
        init: jest.fn().mockResolvedValue(undefined),
        prewarm: jest.fn(),
        cleanupPrewarm: jest.fn(),
        clearAllOptimisticTPSL: clearAll,
        pushPositionsWithOverrides: pushPositions,
        orders: { pushData: jest.fn() },
      });
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsClosePositions') {
          return Promise.resolve({ success: true });
        }
        if (method === 'perpsGetPositions') {
          return Promise.resolve([]);
        }
        return Promise.resolve(undefined);
      });

      renderWithProvider(<PerpsView />, mockStore);

      fireEvent.click(screen.getByTestId('perps-close-all-positions'));

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsClosePositions',
          [{ closeAll: true }],
        );
      });
      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsGetPositions',
          [],
        );
      });
      expect(clearAll).toHaveBeenCalledTimes(1);
      expect(pushPositions).toHaveBeenCalledTimes(1);
      expect(pushPositions).toHaveBeenCalledWith([]);
    });

    it.skip('calls batch cancel and applies a single orders snapshot', async () => {
      const ordersPush = jest.fn();
      mockGetPerpsStreamManager.mockReturnValue({
        init: jest.fn().mockResolvedValue(undefined),
        prewarm: jest.fn(),
        cleanupPrewarm: jest.fn(),
        clearAllOptimisticTPSL: jest.fn(),
        pushPositionsWithOverrides: jest.fn(),
        orders: { pushData: ordersPush },
      });
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsCancelOrders') {
          return Promise.resolve({ success: true });
        }
        if (method === 'perpsGetOpenOrders') {
          return Promise.resolve([]);
        }
        return Promise.resolve(undefined);
      });

      renderWithProvider(<PerpsView />, mockStore);

      fireEvent.click(screen.getByTestId('perps-cancel-all-orders'));

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsCancelOrders',
          [{ cancelAll: true }],
        );
      });
      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsGetOpenOrders',
          [],
        );
      });
      expect(ordersPush).toHaveBeenCalledTimes(1);
      expect(ordersPush).toHaveBeenCalledWith([]);
    });

    it('does not show cancel all when only TP/SL trigger orders are open', () => {
      jest.mocked(streamHooks.usePerpsLiveOrders).mockReturnValue({
        orders: [
          {
            orderId: 'tp-only-1',
            symbol: 'ARB',
            side: 'sell',
            orderType: 'limit',
            size: '500.0',
            originalSize: '500.0',
            price: '1.15',
            filledSize: '0',
            remainingSize: '500.0',
            status: 'open',
            timestamp: Date.now(),
            isTrigger: true,
            triggerPrice: '1.15',
            detailedOrderType: 'Take Profit Limit',
          },
        ],
        isInitialLoading: false,
      });

      renderWithProvider(<PerpsView />, mockStore);

      expect(
        screen.queryByTestId('perps-cancel-all-orders'),
      ).not.toBeInTheDocument();
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsCancelOrders',
        [{ cancelAll: true }],
      );
    });

    it.skip('refreshes open orders when cancel all returns success false with no failures', async () => {
      const ordersPush = jest.fn();
      mockGetPerpsStreamManager.mockReturnValue({
        init: jest.fn().mockResolvedValue(undefined),
        prewarm: jest.fn(),
        cleanupPrewarm: jest.fn(),
        clearAllOptimisticTPSL: jest.fn(),
        pushPositionsWithOverrides: jest.fn(),
        orders: { pushData: ordersPush },
      });
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsCancelOrders') {
          return Promise.resolve({
            success: false,
            successCount: 0,
            failureCount: 0,
          });
        }
        if (method === 'perpsGetOpenOrders') {
          return Promise.resolve([]);
        }
        return Promise.resolve(undefined);
      });

      renderWithProvider(<PerpsView />, mockStore);

      fireEvent.click(screen.getByTestId('perps-cancel-all-orders'));

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsGetOpenOrders',
          [],
        );
      });
      expect(ordersPush).toHaveBeenCalledWith([]);
      expect(
        screen.queryByText(/couldn't load this page/iu),
      ).not.toBeInTheDocument();
    });

    it.skip('shows batch error when cancel all reports failures', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsCancelOrders') {
          return Promise.resolve({
            success: false,
            successCount: 0,
            failureCount: 1,
          });
        }
        return Promise.resolve(undefined);
      });

      renderWithProvider(<PerpsView />, mockStore);

      fireEvent.click(screen.getByTestId('perps-cancel-all-orders'));

      await waitFor(() => {
        expect(
          screen.getByText(/couldn't load this page/iu),
        ).toBeInTheDocument();
      });
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsGetOpenOrders',
        [],
      );
    });
  });

  describe('geo-blocking', () => {
    it('renders the geo-block modal element (closed by default)', () => {
      mockUsePerpsEligibility.mockReturnValue({ isEligible: false });
      renderWithProvider(<PerpsView />, mockStore);

      expect(screen.getByTestId('perps-view')).toBeInTheDocument();
    });
  });
});
