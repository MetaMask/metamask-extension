import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { usePerpsTransactionHistory } from '../../../hooks/perps/usePerpsTransactionHistory';
import * as streamHooks from '../../../hooks/perps/stream';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../shared/constants/perps-events';
import {
  PERPS_TRANSACTION_DETAILS_ROUTE,
  TX_DETAILS_ROUTE,
} from '../../../helpers/constants/routes';
import * as mocks from './mocks';
import { PerpsView } from './perps-view';
import { usePerpsTabExploreData } from './hooks/usePerpsTabExploreData';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockAnalyticsTrackEvent = jest.fn();

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockAnalyticsTrackEvent,
      createEventBuilder,
    }),
  };
});

const mockSubmitRequestToBackground = jest.fn().mockResolvedValue(undefined);
const mockGetPerpsStreamManager = jest.fn();
const mockReplacePerpsToastByKey = jest.fn();

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
  usePerpsToast: () => ({
    replacePerpsToastByKey: mockReplacePerpsToastByKey,
  }),
  PERPS_TOAST_KEYS: {
    CLOSE_ALL_IN_PROGRESS: 'perpsToastCloseAllInProgress',
    CLOSE_ALL_PARTIAL: 'perpsToastCloseAllPartial',
    CLOSE_ALL_SUCCESS: 'perpsToastCloseAllSuccess',
    CLOSE_ALL_FAILED: 'perpsToastCloseAllFailed',
  },
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
    usePerpsAssetNames: jest.fn(() => ({
      resolveAssetName: (symbol: string) => symbol,
    })),
  };
});

jest.mock('./hooks/usePerpsTabExploreData', () => ({
  usePerpsTabExploreData: jest.fn(() => ({
    exploreMarkets: [
      ...mocks.mockCryptoMarkets,
      ...mocks.mockHip3Markets,
    ].slice(0, 5),
    watchlistMarkets: mocks.mockCryptoMarkets.filter((market) =>
      ['BTC', 'ETH'].includes(market.symbol),
    ),
    isInitialLoading: false,
  })),
}));

const mockUsePerpsEligibility = jest.fn(() => ({ isEligible: true }));
jest.mock('../../../hooks/perps/usePerpsEligibility', () => ({
  usePerpsEligibility: () => mockUsePerpsEligibility(),
}));

// By default the compliance gate is a passthrough (wallet not blocked): it runs
// the wrapped action. Individual tests can override it to simulate a block.
const mockComplianceGate = jest.fn(async (action: () => unknown) => action());
jest.mock('../compliance', () => ({
  useSelectedAccountComplianceGate: () => ({ gate: mockComplianceGate }),
}));

jest.mock('./perps-tutorial-modal', () => ({
  PerpsTutorialModal: () => null,
}));

jest.mock('./close-position/close-all-positions-modal', () => ({
  CloseAllPositionsModal: ({
    isOpen,
    onClose,
    onConfirm,
    positions,
    isSubmitting,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    positions: unknown[];
    isSubmitting: boolean;
  }) =>
    isOpen ? (
      <div data-testid="perps-close-all-positions-modal">
        <span data-testid="close-all-position-count">{positions.length}</span>
        <button
          data-testid="perps-close-all-positions-modal-submit"
          onClick={onConfirm}
          disabled={isSubmitting}
          type="button"
        >
          Close all
        </button>
        <button
          data-testid="perps-close-all-positions-modal-cancel"
          onClick={onClose}
          type="button"
        >
          Keep positions
        </button>
      </div>
    ) : null,
}));

jest.mock('../../../../shared/lib/perps-formatters', () => ({
  PRICE_RANGES_UNIVERSAL: [],
  formatPerpsFiat: (value: number | string) => `$${Number(value).toFixed(2)}`,
  formatPnl: (value: number | string) => {
    const amount = Number(value);
    return amount >= 0
      ? `+$${Math.abs(amount).toFixed(2)}`
      : `-$${Math.abs(amount).toFixed(2)}`;
  },
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
    mockComplianceGate.mockImplementation(async (action: () => unknown) =>
      action(),
    );
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
    jest.mocked(streamHooks.usePerpsLivePositions).mockReturnValue({
      positions: mocks.mockPositions,
      isInitialLoading: false,
    });
    jest.mocked(streamHooks.usePerpsLiveOrders).mockReturnValue({
      orders: mocks.mockOrders,
      isInitialLoading: false,
    });
    jest.mocked(streamHooks.usePerpsLiveAccount).mockReturnValue({
      account: mocks.mockAccountState,
      isInitialLoading: false,
    });
    jest.mocked(usePerpsTabExploreData).mockReturnValue({
      exploreMarkets: [...mocks.mockCryptoMarkets, ...mocks.mockHip3Markets],
      watchlistMarkets: mocks.mockCryptoMarkets.filter((market) =>
        ['BTC', 'ETH'].includes(market.symbol),
      ),
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

    it('renders single-position summary RoE from the same position value as the card', () => {
      jest.mocked(streamHooks.usePerpsLivePositions).mockReturnValue({
        positions: [
          {
            ...mocks.mockPositions[0],
            unrealizedPnl: '4.20',
            returnOnEquity: '0.42',
          },
        ],
        isInitialLoading: false,
      });
      jest.mocked(streamHooks.usePerpsLiveAccount).mockReturnValue({
        account: {
          ...mocks.mockAccountState,
          unrealizedPnl: '1.00',
          returnOnEquity: '1',
        },
        isInitialLoading: false,
      });

      renderWithProvider(<PerpsView />, mockStore);

      expect(
        screen.getByTestId('perps-balance-dropdown-pnl'),
      ).toHaveTextContent('42.00%');
      expect(screen.getByTestId('position-card-roe-ETH')).toHaveTextContent(
        '42.00%',
      );
    });

    it('keeps multi-position summary RoE on the account aggregate', () => {
      jest.mocked(streamHooks.usePerpsLivePositions).mockReturnValue({
        positions: [
          {
            ...mocks.mockPositions[0],
            returnOnEquity: '0.42',
          },
          {
            ...mocks.mockPositions[1],
            returnOnEquity: '0.24',
          },
        ],
        isInitialLoading: false,
      });
      jest.mocked(streamHooks.usePerpsLiveAccount).mockReturnValue({
        account: {
          ...mocks.mockAccountState,
          returnOnEquity: '1',
        },
        isInitialLoading: false,
      });

      renderWithProvider(<PerpsView />, mockStore);

      expect(
        screen.getByTestId('perps-balance-dropdown-pnl'),
      ).toHaveTextContent('1.00%');
    });

    it('renders order cards for each order', () => {
      renderWithProvider(<PerpsView />, mockStore);

      // Check that at least the first order is rendered
      expect(screen.getByTestId('order-card-order-001')).toBeInTheDocument();
    });

    it('filters TP/SL trigger orders from Open orders on the Perps tab', () => {
      renderWithProvider(<PerpsView />, mockStore);

      expect(screen.getByTestId('order-card-order-001')).toBeInTheDocument();
      expect(
        screen.queryByTestId('order-card-order-004'),
      ).not.toBeInTheDocument();
    });

    it('displays position section header', () => {
      renderWithProvider(<PerpsView />, mockStore);

      expect(screen.getByText(/positions/iu)).toBeInTheDocument();
    });

    it('displays orders section header', () => {
      renderWithProvider(<PerpsView />, mockStore);

      expect(screen.getByText(/open orders/iu)).toBeInTheDocument();
    });

    it('displays close all button in positions section', () => {
      renderWithProvider(<PerpsView />, mockStore);

      expect(
        screen.getByTestId('perps-close-all-positions'),
      ).toBeInTheDocument();
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

    it('navigates to the Perps transaction details page when a Recent Activity trade row is clicked', () => {
      jest.mocked(usePerpsTransactionHistory).mockReturnValueOnce({
        transactions: mocks.mockTransactions,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderWithProvider(<PerpsView />, mockStore);

      fireEvent.click(screen.getByTestId('transaction-card-tx-001'));

      const tradeTransaction = mocks.mockTransactions.find(
        (transaction) => transaction.id === 'tx-001',
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        PERPS_TRANSACTION_DETAILS_ROUTE,
        { state: { transaction: tradeTransaction } },
      );
    });

    it('navigates to the generic tx details route when a Recent Activity deposit row is clicked', () => {
      jest.mocked(usePerpsTransactionHistory).mockReturnValueOnce({
        transactions: mocks.mockTransactions,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      renderWithProvider(<PerpsView />, mockStore);

      fireEvent.click(screen.getByTestId('transaction-card-tx-005'));

      const depositTransaction = mocks.mockTransactions.find(
        (transaction) => transaction.id === 'tx-005',
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        `${TX_DETAILS_ROUTE}/eip155:42161/${depositTransaction?.depositWithdrawal?.txHash}`,
        { state: undefined },
      );
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

  describe('close all and cancel all', () => {
    it('opens confirmation modal when close all button is clicked', () => {
      renderWithProvider(<PerpsView />, mockStore);

      fireEvent.click(screen.getByTestId('perps-close-all-positions'));

      expect(
        screen.getByTestId('perps-close-all-positions-modal'),
      ).toBeInTheDocument();
    });

    it('does not open the confirmation modal when the compliance gate blocks', async () => {
      // Simulate a blocked wallet: the gate short-circuits and never runs the
      // wrapped action that opens the confirmation modal.
      mockComplianceGate.mockImplementationOnce(async () => undefined);
      renderWithProvider(<PerpsView />, mockStore);

      fireEvent.click(screen.getByTestId('perps-close-all-positions'));

      await waitFor(() => expect(mockComplianceGate).toHaveBeenCalled());
      expect(
        screen.queryByTestId('perps-close-all-positions-modal'),
      ).not.toBeInTheDocument();
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsClosePositions',
        expect.anything(),
      );
    });

    it('calls batch close after confirmation and applies a single positions snapshot', async () => {
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
      fireEvent.click(
        screen.getByTestId('perps-close-all-positions-modal-submit'),
      );

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

    it('does not execute close all when confirmation is cancelled', () => {
      renderWithProvider(<PerpsView />, mockStore);

      fireEvent.click(screen.getByTestId('perps-close-all-positions'));
      expect(
        screen.getByTestId('perps-close-all-positions-modal'),
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByTestId('perps-close-all-positions-modal-cancel'),
      );

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsClosePositions',
        expect.anything(),
      );
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

    it('shows partial toast and tracks FAILED status when some positions fail to close', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsClosePositions') {
          return Promise.resolve({
            success: false,
            successCount: 1,
            failureCount: 1,
          });
        }
        return Promise.resolve(undefined);
      });

      renderWithProvider(<PerpsView />, mockStore);

      fireEvent.click(screen.getByTestId('perps-close-all-positions'));
      fireEvent.click(
        screen.getByTestId('perps-close-all-positions-modal-submit'),
      );

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
          key: 'perpsToastCloseAllPartial',
          messageParams: [1, mocks.mockPositions.length],
        });
      });

      const closeTxCalls = mockAnalyticsTrackEvent.mock.calls.filter(
        ([arg]) =>
          arg?.name === MetaMetricsEventName.PerpsPositionCloseTransaction,
      );
      expect(closeTxCalls).toHaveLength(1);
      expect(closeTxCalls[0][0]).toEqual(
        expect.objectContaining({
          properties: expect.objectContaining({
            [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.FAILED,
            [PERPS_EVENT_PROPERTY.NUMBER_POSITIONS_CLOSED]: 1,
          }),
        }),
      );
    });

    it('shows failed toast and tracks FAILED status when all positions fail to close', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsClosePositions') {
          return Promise.resolve({
            success: false,
            successCount: 0,
            failureCount: 2,
          });
        }
        return Promise.resolve(undefined);
      });

      renderWithProvider(<PerpsView />, mockStore);

      fireEvent.click(screen.getByTestId('perps-close-all-positions'));
      fireEvent.click(
        screen.getByTestId('perps-close-all-positions-modal-submit'),
      );

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
          key: 'perpsToastCloseAllFailed',
        });
      });

      const closeTxCalls = mockAnalyticsTrackEvent.mock.calls.filter(
        ([arg]) =>
          arg?.name === MetaMetricsEventName.PerpsPositionCloseTransaction,
      );
      expect(closeTxCalls).toHaveLength(1);
      expect(closeTxCalls[0][0]).toEqual(
        expect.objectContaining({
          properties: expect.objectContaining({
            [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.FAILED,
            [PERPS_EVENT_PROPERTY.NUMBER_POSITIONS_CLOSED]: 0,
          }),
        }),
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

  it('passes tab explore and watchlist markets from the tab hook', () => {
    jest.mocked(usePerpsTabExploreData).mockReturnValue({
      exploreMarkets: [mocks.mockCryptoMarkets[0]],
      watchlistMarkets: [mocks.mockCryptoMarkets[1]],
      isInitialLoading: false,
    });

    renderWithProvider(<PerpsView />, mockStore);

    expect(screen.getByTestId('explore-markets-BTC')).toBeInTheDocument();
    expect(screen.queryByTestId('explore-markets-ETH')).not.toBeInTheDocument();
    expect(screen.getByTestId('perps-watchlist-ETH')).toBeInTheDocument();
    expect(screen.queryByTestId('perps-watchlist-BTC')).not.toBeInTheDocument();
  });

  describe('analytics tracking', () => {
    it('fires Perp Screen Viewed with wallet_home_perps_tab screen_type once loading completes', () => {
      renderWithProvider(<PerpsView />, mockStore);

      const screenViewedCalls = mockAnalyticsTrackEvent.mock.calls.filter(
        ([arg]) => arg?.name === MetaMetricsEventName.PerpsScreenViewed,
      );

      expect(screenViewedCalls).toHaveLength(1);
      expect(screenViewedCalls[0][0]).toEqual(
        expect.objectContaining({
          name: MetaMetricsEventName.PerpsScreenViewed,
          properties: expect.objectContaining({
            category: MetaMetricsEventCategory.Perps,
            [PERPS_EVENT_PROPERTY.SCREEN_TYPE]: 'wallet_home_perps_tab',
            [PERPS_EVENT_PROPERTY.OPEN_POSITION]: expect.any(Number),
            [PERPS_EVENT_PROPERTY.OPEN_ORDER]: expect.any(Number),
            [PERPS_EVENT_PROPERTY.SOURCE]: 'homescreen_tab',
            [PERPS_EVENT_PROPERTY.HAS_PERP_BALANCE]: true,
          }),
        }),
      );
    });

    it('does not fire Perp Screen Viewed while loading', () => {
      jest.mocked(streamHooks.usePerpsLivePositions).mockReturnValue({
        positions: mocks.mockPositions,
        isInitialLoading: true,
      });

      renderWithProvider(<PerpsView />, mockStore);

      expect(mockAnalyticsTrackEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({
          name: MetaMetricsEventName.PerpsScreenViewed,
        }),
      );
    });

    it('does not fire Perp Screen Viewed while account data is still loading', () => {
      // positions/orders/markets are ready but account hasn't arrived yet
      jest.mocked(streamHooks.usePerpsLiveAccount).mockReturnValue({
        account: null,
        isInitialLoading: true,
      });

      renderWithProvider(<PerpsView />, mockStore);

      expect(mockAnalyticsTrackEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({
          name: MetaMetricsEventName.PerpsScreenViewed,
        }),
      );
    });

    it('tracks has_perp_balance when unified account funds are tradeable but not withdrawable', () => {
      jest.mocked(streamHooks.usePerpsLiveAccount).mockReturnValue({
        account: {
          ...mocks.mockAccountState,
          spendableBalance: '0',
          withdrawableBalance: '100',
        },
        isInitialLoading: false,
      });

      renderWithProvider(<PerpsView />, mockStore);

      expect(mockAnalyticsTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: MetaMetricsEventName.PerpsScreenViewed,
          properties: expect.objectContaining({
            [PERPS_EVENT_PROPERTY.HAS_PERP_BALANCE]: true,
          }),
        }),
      );
    });

    it('reports no perp balance when withdrawableBalance is zero even if spendableBalance is positive', () => {
      jest.mocked(streamHooks.usePerpsLiveAccount).mockReturnValue({
        account: {
          ...mocks.mockAccountState,
          spendableBalance: '100',
          withdrawableBalance: '0',
        },
        isInitialLoading: false,
      });

      renderWithProvider(<PerpsView />, mockStore);

      expect(mockAnalyticsTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: MetaMetricsEventName.PerpsScreenViewed,
          properties: expect.objectContaining({
            [PERPS_EVENT_PROPERTY.HAS_PERP_BALANCE]: false,
          }),
        }),
      );
    });
  });
});
