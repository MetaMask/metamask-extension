import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import {
  mockPositions,
  mockOrders,
  mockAccountState,
  mockCryptoMarkets,
  mockHip3Markets,
  mockTransactions,
} from '../../components/app/perps/mocks';
import { PERPS_ACTIVITY_ROUTE } from '../../helpers/constants/routes';

jest.mock('@metamask/perps-controller', () => ({
  PERPS_ERROR_CODES: {
    CLIENT_NOT_INITIALIZED: 'CLIENT_NOT_INITIALIZED',
    CLIENT_REINITIALIZING: 'CLIENT_REINITIALIZING',
    PROVIDER_NOT_AVAILABLE: 'PROVIDER_NOT_AVAILABLE',
    TOKEN_NOT_SUPPORTED: 'TOKEN_NOT_SUPPORTED',
    BRIDGE_CONTRACT_NOT_FOUND: 'BRIDGE_CONTRACT_NOT_FOUND',
    WITHDRAW_FAILED: 'WITHDRAW_FAILED',
    POSITIONS_FAILED: 'POSITIONS_FAILED',
    ACCOUNT_STATE_FAILED: 'ACCOUNT_STATE_FAILED',
    MARKETS_FAILED: 'MARKETS_FAILED',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    ORDER_LEVERAGE_REDUCTION_FAILED: 'ORDER_LEVERAGE_REDUCTION_FAILED',
    IOC_CANCEL: 'IOC_CANCEL',
    CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
    WITHDRAW_ASSET_ID_REQUIRED: 'WITHDRAW_ASSET_ID_REQUIRED',
    WITHDRAW_AMOUNT_REQUIRED: 'WITHDRAW_AMOUNT_REQUIRED',
    WITHDRAW_AMOUNT_POSITIVE: 'WITHDRAW_AMOUNT_POSITIVE',
    WITHDRAW_INVALID_DESTINATION: 'WITHDRAW_INVALID_DESTINATION',
    WITHDRAW_ASSET_NOT_SUPPORTED: 'WITHDRAW_ASSET_NOT_SUPPORTED',
    WITHDRAW_INSUFFICIENT_BALANCE: 'WITHDRAW_INSUFFICIENT_BALANCE',
    DEPOSIT_ASSET_ID_REQUIRED: 'DEPOSIT_ASSET_ID_REQUIRED',
    DEPOSIT_AMOUNT_REQUIRED: 'DEPOSIT_AMOUNT_REQUIRED',
    DEPOSIT_AMOUNT_POSITIVE: 'DEPOSIT_AMOUNT_POSITIVE',
    DEPOSIT_MINIMUM_AMOUNT: 'DEPOSIT_MINIMUM_AMOUNT',
    ORDER_COIN_REQUIRED: 'ORDER_COIN_REQUIRED',
    ORDER_LIMIT_PRICE_REQUIRED: 'ORDER_LIMIT_PRICE_REQUIRED',
    ORDER_PRICE_POSITIVE: 'ORDER_PRICE_POSITIVE',
    ORDER_UNKNOWN_COIN: 'ORDER_UNKNOWN_COIN',
    ORDER_SIZE_POSITIVE: 'ORDER_SIZE_POSITIVE',
    ORDER_PRICE_REQUIRED: 'ORDER_PRICE_REQUIRED',
    ORDER_SIZE_MIN: 'ORDER_SIZE_MIN',
    ORDER_LEVERAGE_INVALID: 'ORDER_LEVERAGE_INVALID',
    ORDER_LEVERAGE_BELOW_POSITION: 'ORDER_LEVERAGE_BELOW_POSITION',
    ORDER_MAX_VALUE_EXCEEDED: 'ORDER_MAX_VALUE_EXCEEDED',
    EXCHANGE_CLIENT_NOT_AVAILABLE: 'EXCHANGE_CLIENT_NOT_AVAILABLE',
    INFO_CLIENT_NOT_AVAILABLE: 'INFO_CLIENT_NOT_AVAILABLE',
    SUBSCRIPTION_CLIENT_NOT_AVAILABLE: 'SUBSCRIPTION_CLIENT_NOT_AVAILABLE',
    NO_ACCOUNT_SELECTED: 'NO_ACCOUNT_SELECTED',
    KEYRING_LOCKED: 'KEYRING_LOCKED',
    INVALID_ADDRESS_FORMAT: 'INVALID_ADDRESS_FORMAT',
    TRANSFER_FAILED: 'TRANSFER_FAILED',
    SWAP_FAILED: 'SWAP_FAILED',
    SPOT_PAIR_NOT_FOUND: 'SPOT_PAIR_NOT_FOUND',
    PRICE_UNAVAILABLE: 'PRICE_UNAVAILABLE',
    BATCH_CANCEL_FAILED: 'BATCH_CANCEL_FAILED',
    BATCH_CLOSE_FAILED: 'BATCH_CLOSE_FAILED',
    INSUFFICIENT_MARGIN: 'INSUFFICIENT_MARGIN',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    REDUCE_ONLY_VIOLATION: 'REDUCE_ONLY_VIOLATION',
    POSITION_WOULD_FLIP: 'POSITION_WOULD_FLIP',
    MARGIN_ADJUSTMENT_FAILED: 'MARGIN_ADJUSTMENT_FAILED',
    TPSL_UPDATE_FAILED: 'TPSL_UPDATE_FAILED',
    ORDER_REJECTED: 'ORDER_REJECTED',
    SLIPPAGE_EXCEEDED: 'SLIPPAGE_EXCEEDED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    NETWORK_ERROR: 'NETWORK_ERROR',
  },
}));

// Mock lightweight-charts to prevent DOM rendering issues in tests
const mockPriceLine = { options: jest.fn() };
jest.mock('lightweight-charts', () => ({
  createChart: () => ({
    addSeries: () => ({
      setData: jest.fn(),
      update: jest.fn(),
      createPriceLine: jest.fn().mockReturnValue(mockPriceLine),
      removePriceLine: jest.fn(),
      priceScale: jest.fn().mockReturnValue({ applyOptions: jest.fn() }),
      applyOptions: jest.fn(),
    }),
    applyOptions: jest.fn(),
    timeScale: jest.fn().mockReturnValue({
      fitContent: jest.fn(),
      scrollToPosition: jest.fn(),
      scrollToRealTime: jest.fn(),
      getVisibleLogicalRange: jest.fn(),
      setVisibleLogicalRange: jest.fn(),
      subscribeVisibleLogicalRangeChange: jest.fn(),
      unsubscribeVisibleLogicalRangeChange: jest.fn(),
      applyOptions: jest.fn(),
    }),
    panes: jest.fn().mockReturnValue([]),
    priceScale: jest.fn().mockReturnValue({ applyOptions: jest.fn() }),
    resize: jest.fn(),
    remove: jest.fn(),
    subscribeCrosshairMove: jest.fn(),
    unsubscribeCrosshairMove: jest.fn(),
  }),
  CandlestickSeries: 'CandlestickSeries',
  HistogramSeries: 'HistogramSeries',
  ColorType: { Solid: 'Solid' },
  CrosshairMode: { Normal: 0 },
  LineStyle: { Dashed: 2, Solid: 0 },
  PriceScaleMode: { Normal: 0 },
}));

// Mock semver to control version comparison in tests
jest.mock('semver', () => ({
  gte: jest.fn(() => true),
}));

// Mock loglevel to prevent console noise
jest.mock('loglevel', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    setLevel: jest.fn(),
    setDefaultLevel: jest.fn(),
  },
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  setLevel: jest.fn(),
  setDefaultLevel: jest.fn(),
}));

const mockSubmitRequestToBackground = jest
  .fn()
  .mockResolvedValue({ success: true });
let latestPriceSubscriber:
  | ((updates: { symbol: string; percentChange24h?: string }[]) => void)
  | undefined;
const mockPriceSubscribe = jest.fn((callback) => {
  latestPriceSubscriber = callback;
  return jest.fn();
});

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('../../hooks/perps/usePerpsOrderFees', () => ({
  usePerpsOrderFees: () => ({
    feeRate: 0.0001,
    isLoading: false,
    hasError: false,
  }),
}));

jest.mock('../../selectors/accounts', () => ({
  ...jest.requireActual('../../selectors/accounts'),
  getSelectedInternalAccount: () => ({ address: '0x123' }),
}));

jest.mock('../../providers/perps', () => ({
  getPerpsStreamManager: () => ({
    positions: {
      getCachedData: () => [],
      pushData: jest.fn(),
      subscribe: jest.fn(() => jest.fn()),
    },
    orders: { getCachedData: () => [], pushData: jest.fn() },
    account: { getCachedData: () => null, pushData: jest.fn() },
    markets: { getCachedData: () => [], pushData: jest.fn() },
    prices: {
      subscribe: (...args: [Parameters<typeof mockPriceSubscribe>[0]]) =>
        mockPriceSubscribe(...args),
      getCachedData: () => [],
    },
    setOptimisticTPSL: jest.fn(),
    clearOptimisticTPSL: jest.fn(),
    pushPositionsWithOverrides: jest.fn(),
    prewarm: jest.fn(),
    cleanupPrewarm: jest.fn(),
    isInitialized: () => true,
    init: jest.fn(),
  }),
}));

const mockReplacePerpsToastByKey = jest.fn();
const mockSetPendingOrder = jest.fn();
jest.mock('../../components/app/perps/perps-toast', () => {
  const { PERPS_TOAST_KEYS } = jest.requireActual(
    '../../components/app/perps/perps-toast/perps-toast-provider',
  );

  return {
    PERPS_TOAST_KEYS,
    usePerpsToast: () => ({
      replacePerpsToastByKey: mockReplacePerpsToastByKey,
      setPendingOrder: mockSetPendingOrder,
      pendingOrder: null,
    }),
  };
});

const mockUsePerpsMarketFills = jest
  .fn()
  .mockReturnValue({ fills: [], isInitialLoading: false });
const mockTriggerDeposit = jest.fn().mockResolvedValue({
  transactionId: 'perps-deposit-tx',
});
const mockLiveAccount = jest.fn(() => ({
  account: mockAccountState,
  isInitialLoading: false,
}));

const mockUsePerpsEligibility = jest.fn(() => ({ isEligible: true }));
jest.mock('../../hooks/perps', () => ({
  usePerpsEligibility: () => mockUsePerpsEligibility(),
  usePerpsEventTracking: () => ({ track: jest.fn() }),
  usePerpsOrderForm: jest.fn(),
  useUserHistory: jest.fn(),
  usePerpsTransactionHistory: jest.fn(),
  usePerpsMarginCalculations: jest.fn(),
  usePerpsMarketFills: (...args: unknown[]) => mockUsePerpsMarketFills(...args),
  usePerpsMarketInfo: jest.fn(),
}));
jest.mock(
  '../../components/app/perps/hooks/usePerpsDepositConfirmation',
  () => ({
    usePerpsDepositConfirmation: () => ({
      trigger: mockTriggerDeposit,
      isLoading: false,
    }),
  }),
);

const mockLivePositions = jest.fn(() => ({
  positions: mockPositions,
  isInitialLoading: false,
}));

// Mock the perps stream hooks
jest.mock('../../hooks/perps/stream', () => ({
  usePerpsLivePositions: () => mockLivePositions(),
  usePerpsLiveOrders: () => ({
    orders: mockOrders,
    isInitialLoading: false,
  }),
  usePerpsLiveAccount: () => mockLiveAccount(),
  usePerpsLiveMarketData: () => ({
    markets: [...mockCryptoMarkets, ...mockHip3Markets],
    isInitialLoading: false,
  }),
  usePerpsLiveCandles: () => ({
    candleData: {
      symbol: 'ETH',
      interval: '5m',
      candles: [
        {
          time: 1768188300000,
          open: '2880.0',
          high: '2920.0',
          low: '2870.0',
          close: '2900.0',
          volume: '100.0',
        },
      ],
    },
    isInitialLoading: false,
    isLoadingMore: false,
    hasHistoricalData: true,
    error: null,
    fetchMoreHistory: jest.fn(),
  }),
}));

jest.mock('../../hooks/perps/usePerpsOrderFees', () => ({
  usePerpsOrderFees: () => ({
    feeRate: 0.00145,
    isLoading: false,
    hasError: false,
  }),
}));

// Mock usePerpsTransactionHistory hook to avoid controller dependency
jest.mock('../../hooks/perps/usePerpsTransactionHistory', () => ({
  usePerpsTransactionHistory: () => ({
    transactions: mockTransactions,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('../../components/app/perps/perps-tutorial-modal', () => ({
  PerpsTutorialModal: () => null,
}));

jest.mock('../../components/app/perps/perps-candlestick-chart', () => {
  // require React inside factory to avoid jest.mock hoisting scope restrictions
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockReact = require('react');
  return {
    PerpsCandlestickChart: mockReact.forwardRef(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (props: any, _ref: any) =>
        mockReact.createElement('div', {
          'data-testid': 'perps-candlestick-chart',
          'data-price-lines': JSON.stringify(props.priceLines ?? []),
        }),
    ),
  };
});

const mockUseParams = jest.fn().mockReturnValue({ symbol: 'ETH' });
const mockUseNavigate = jest.fn();
const mockUseLocation = jest.fn().mockReturnValue({
  pathname: '/perps/market/ETH',
  search: '',
  state: null,
});
const mockNavigateComponent = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
  useLocation: () => mockUseLocation(),
  useParams: () => mockUseParams(),
  Navigate: (props: { to: string; replace?: boolean }) => {
    mockNavigateComponent(props);
    return null;
  },
}));

// eslint-disable-next-line import-x/first
import PerpsMarketDetailPage from './perps-market-detail-page';

async function renderPage(
  store: ReturnType<ReturnType<typeof configureMockStore>>,
) {
  let result!: ReturnType<typeof renderWithProvider>;
  await act(async () => {
    result = renderWithProvider(<PerpsMarketDetailPage />, store);
  });
  return result;
}

describe('PerpsMarketDetailPage', () => {
  const middlewares = [thunk];
  const mockStore = configureMockStore(middlewares);

  // Create a state with perps enabled
  const createMockState = (perpsEnabled = true) => ({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      remoteFeatureFlags: {
        ...mockState.metamask.remoteFeatureFlags,
        perpsEnabledVersion: perpsEnabled
          ? { enabled: true, minimumVersion: '0.0.0' }
          : { enabled: false, minimumVersion: '99.99.99' },
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsEligibility.mockReturnValue({ isEligible: true });
    mockReplacePerpsToastByKey.mockReset();
    mockTriggerDeposit.mockClear();
    mockLiveAccount.mockReturnValue({
      account: mockAccountState,
      isInitialLoading: false,
    });
    mockLivePositions.mockReturnValue({
      positions: mockPositions,
      isInitialLoading: false,
    });
    mockUsePerpsMarketFills.mockReturnValue({
      fills: [],
      isInitialLoading: false,
    });
    mockUseParams.mockReturnValue({ symbol: 'ETH' });
    latestPriceSubscriber = undefined;
    mockUseLocation.mockReturnValue({
      pathname: '/perps/market/ETH',
      search: '',
      state: null,
    });
  });

  describe('when perps feature is enabled', () => {
    it('renders market detail page for ETH', async () => {
      const store = mockStore(createMockState(true));

      const { getByTestId } = await renderPage(store);

      expect(getByTestId('perps-market-detail-page')).toBeInTheDocument();
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsActivatePriceStream',
        [{ symbols: ['ETH'], includeMarketData: true }],
      );
    });

    it('renders return using percent semantics from controller values', async () => {
      const store = mockStore(createMockState(true));
      await renderPage(store);

      expect(screen.getByText(/15\.79%/u)).toBeInTheDocument();
    });

    it('shows order filled toast when route state has pendingOrderSymbol and matching position exists', async () => {
      mockUseLocation.mockReturnValue({
        pathname: '/perps/market/ETH',
        search: '',
        state: {
          pendingOrderSymbol: 'ETH',
          pendingOrderFilledDescription: 'Long 0.33 ETH',
        },
      });
      const store = mockStore(createMockState(true));

      await renderPage(store);

      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastOrderFilled',
        description: 'Long 0.33 ETH',
      });
    });

    it('shows order filled toast without description when pendingOrderFilledDescription is absent', async () => {
      mockUseLocation.mockReturnValue({
        pathname: '/perps/market/ETH',
        search: '',
        state: {
          pendingOrderSymbol: 'ETH',
        },
      });
      const store = mockStore(createMockState(true));

      await renderPage(store);

      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastOrderFilled',
      });
    });

    it('does not show order filled toast when no matching position exists', async () => {
      mockUseLocation.mockReturnValue({
        pathname: '/perps/market/ETH',
        search: '',
        state: {
          pendingOrderSymbol: 'DOGE',
          pendingOrderFilledDescription: 'Long 100 DOGE',
        },
      });
      const store = mockStore(createMockState(true));

      await renderPage(store);

      expect(mockReplacePerpsToastByKey).not.toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastOrderFilled',
        }),
      );
    });

    it('does not show order filled toast when pendingOrderSymbol is absent', async () => {
      mockUseLocation.mockReturnValue({
        pathname: '/perps/market/ETH',
        search: '',
        state: { someOtherKey: 'value' },
      });
      const store = mockStore(createMockState(true));

      await renderPage(store);

      expect(mockReplacePerpsToastByKey).not.toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastOrderFilled',
        }),
      );
    });

    it('does not show order filled toast when pendingOrderSymbol is not a string', async () => {
      mockUseLocation.mockReturnValue({
        pathname: '/perps/market/ETH',
        search: '',
        state: {
          pendingOrderSymbol: 123,
        },
      });
      const store = mockStore(createMockState(true));

      await renderPage(store);

      expect(mockReplacePerpsToastByKey).not.toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastOrderFilled',
        }),
      );
    });

    it('does not show order filled toast when route state is null', async () => {
      mockUseLocation.mockReturnValue({
        pathname: '/perps/market/ETH',
        search: '',
        state: null,
      });
      const store = mockStore(createMockState(true));

      await renderPage(store);

      expect(mockReplacePerpsToastByKey).not.toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastOrderFilled',
        }),
      );
    });

    it('shows handed-off perps toast and clears route state', async () => {
      mockUseLocation.mockReturnValue({
        pathname: '/perps/market/ETH',
        search: '',
        state: {
          perpsToastKey: 'perpsToastOrderPlaced',
          perpsToastDescription: 'Long 0.5 ETH',
        },
      });
      const store = mockStore(createMockState(true));

      await renderPage(store);

      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastOrderPlaced',
        description: 'Long 0.5 ETH',
      });
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH', {
        replace: true,
        state: undefined,
      });
    });

    it('displays market symbol and price', async () => {
      const store = mockStore(createMockState(true));

      const { getByTestId, getByText } = await renderPage(store);

      expect(getByTestId('perps-market-detail-price')).toBeInTheDocument();
      expect(getByText('ETH-USD')).toBeInTheDocument();
    });

    it('renders market detail page for BTC', async () => {
      mockUseParams.mockReturnValue({ symbol: 'BTC' });
      const store = mockStore(createMockState(true));

      const { getByTestId, getByText } = await renderPage(store);

      expect(getByTestId('perps-market-detail-page')).toBeInTheDocument();
      expect(getByText('BTC-USD')).toBeInTheDocument();
    });

    it('displays back button', async () => {
      const store = mockStore(createMockState(true));

      const { getByTestId } = await renderPage(store);

      expect(
        getByTestId('perps-market-detail-back-button'),
      ).toBeInTheDocument();
    });

    it('navigates back in history when back button is clicked', async () => {
      const store = mockStore(createMockState(true));

      const { getByTestId } = await renderPage(store);

      const backButton = getByTestId('perps-market-detail-back-button');
      backButton.click();

      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
    });

    it('uses market 24h change as fallback when no live percent update exists', async () => {
      const store = mockStore(createMockState(true));

      const { getByTestId } = await renderPage(store);

      expect(getByTestId('perps-market-detail-change')).toHaveTextContent(
        '+2.56%',
      );
    });

    it('uses live percentChange24h when the price stream provides it', async () => {
      const store = mockStore(createMockState(true));
      const { getByTestId } = await renderPage(store);

      await waitFor(() => {
        expect(mockPriceSubscribe).toHaveBeenCalled();
      });

      act(() => {
        latestPriceSubscriber?.([
          {
            symbol: 'ETH',
            percentChange24h: '+9.99%',
          },
        ]);
      });

      await waitFor(() => {
        expect(getByTestId('perps-market-detail-change')).toHaveTextContent(
          '+9.99%',
        );
      });
    });

    it('appends % to live percentChange24h when the stream omits it', async () => {
      const store = mockStore(createMockState(true));
      const { getByTestId } = await renderPage(store);

      await waitFor(() => {
        expect(mockPriceSubscribe).toHaveBeenCalled();
      });

      act(() => {
        latestPriceSubscriber?.([
          {
            symbol: 'ETH',
            percentChange24h: '+9.99',
          },
        ]);
      });

      await waitFor(() => {
        expect(getByTestId('perps-market-detail-change')).toHaveTextContent(
          '+9.99%',
        );
      });
    });

    it('displays candlestick chart', async () => {
      const store = mockStore(createMockState(true));

      const { getByTestId } = await renderPage(store);

      expect(getByTestId('perps-market-detail-chart')).toBeInTheDocument();
      expect(getByTestId('perps-candlestick-chart')).toBeInTheDocument();
    });

    it('passes a Liq price line to the chart when position has a liquidationPrice', async () => {
      // ETH mock position has liquidationPrice: '2400.00'
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      const store = mockStore(createMockState(true));

      const { getByTestId } = await renderPage(store);

      const chart = getByTestId('perps-candlestick-chart');
      const priceLines = JSON.parse(
        chart.getAttribute('data-price-lines') ?? '[]',
      ) as { label: string; price: number }[];

      const liqLine = priceLines.find((l) => l.label === 'Liq');
      expect(liqLine).toBeDefined();
      expect(liqLine?.price).toBe(2400);
    });

    it('omits the Liq price line from the chart when position liquidationPrice is null', async () => {
      mockLivePositions.mockReturnValue({
        positions: [{ ...mockPositions[0], liquidationPrice: null }],
        isInitialLoading: false,
      });
      const store = mockStore(createMockState(true));

      const { getByTestId } = await renderPage(store);

      const chart = getByTestId('perps-candlestick-chart');
      const priceLines = JSON.parse(
        chart.getAttribute('data-price-lines') ?? '[]',
      ) as { label: string }[];

      expect(priceLines.find((l) => l.label === 'Liq')).toBeUndefined();
    });

    it('displays favorite button', async () => {
      const store = mockStore(createMockState(true));

      const { getByTestId } = await renderPage(store);

      expect(
        getByTestId('perps-market-detail-favorite-button'),
      ).toBeInTheDocument();
    });

    it('renders HIP-3 equity market (TSLA)', async () => {
      mockUseParams.mockReturnValue({ symbol: 'xyz:TSLA' });
      const store = mockStore(createMockState(true));

      const { getByTestId, getByText } = await renderPage(store);

      expect(getByTestId('perps-market-detail-page')).toBeInTheDocument();
      // Should display "TSLA-USD" with the stripped display name
      expect(getByText('TSLA-USD')).toBeInTheDocument();
    });

    it('displays position section when user has a position', async () => {
      const store = mockStore(createMockState(true));

      const { getByText } = await renderPage(store);

      // ETH has a mock position
      expect(getByText(messages.perpsPosition.message)).toBeInTheDocument();
    });

    it('displays position P&L', async () => {
      const store = mockStore(createMockState(true));

      const { getByText } = await renderPage(store);

      // Check for P&L label
      expect(getByText(messages.perpsPnl.message)).toBeInTheDocument();
    });

    it('displays position details section', async () => {
      const store = mockStore(createMockState(true));

      const { getByText, getAllByText } = await renderPage(store);

      expect(getByText(messages.perpsDetails.message)).toBeInTheDocument();
      expect(getByText(messages.perpsDirection.message)).toBeInTheDocument();
      expect(getByText(messages.perpsEntryPrice.message)).toBeInTheDocument();
      // 'Liquidation price' appears in both the Details section and the
      // Edit Margin expandable, so use getAllByText
      expect(
        getAllByText(messages.perpsLiquidationPrice.message).length,
      ).toBeGreaterThanOrEqual(1);
    });

    it('displays leverage value in position details', () => {
      const store = mockStore(createMockState(true));

      const { getByTestId, getByText } = renderWithProvider(
        <PerpsMarketDetailPage />,
        store,
      );

      expect(getByTestId('perps-position-leverage')).toBeInTheDocument();
      expect(
        getByText(new RegExp(`${messages.perpsLong.message} 3x`, 'u')),
      ).toBeInTheDocument();
    });

    it('displays stats section', async () => {
      const store = mockStore(createMockState(true));

      const { getByText } = await renderPage(store);

      expect(getByText(messages.perpsStats.message)).toBeInTheDocument();
      expect(getByText(messages.perps24hVolume.message)).toBeInTheDocument();
    });

    it('displays recent activity section', async () => {
      const store = mockStore(createMockState(true));

      const { getByText } = await renderPage(store);

      expect(
        getByText(messages.perpsRecentActivity.message),
      ).toBeInTheDocument();
    });

    it('does not show View All button when there are no fills', () => {
      const store = mockStore(createMockState(true));

      renderWithProvider(<PerpsMarketDetailPage />, store);

      expect(
        screen.queryByTestId('perps-market-detail-view-all-activity'),
      ).not.toBeInTheDocument();
    });

    it('shows View All button when there are fills and navigates to activity page', () => {
      mockUsePerpsMarketFills.mockReturnValue({
        fills: [
          {
            orderId: 'fill-1',
            symbol: 'ETH',
            side: 'buy',
            size: '1.0',
            price: '2500.00',
            pnl: '0',
            direction: 'Open Long',
            fee: '0.50',
            feeToken: 'USDC',
            timestamp: Date.now(),
          },
        ],
        isInitialLoading: false,
      });
      const store = mockStore(createMockState(true));

      renderWithProvider(<PerpsMarketDetailPage />, store);

      const viewAllButton = screen.getByTestId(
        'perps-market-detail-view-all-activity',
      );
      expect(viewAllButton).toBeInTheDocument();

      fireEvent.click(viewAllButton);
      expect(mockUseNavigate).toHaveBeenCalledWith(PERPS_ACTIVITY_ROUTE);
    });

    it('displays learn section', async () => {
      const store = mockStore(createMockState(true));

      const { getByText } = await renderPage(store);

      expect(getByText(messages.perpsLearnBasics.message)).toBeInTheDocument();
    });

    it('opens Modify menu with Add margin, Remove margin, and Reverse position when Modify button is clicked', async () => {
      const store = mockStore(createMockState(true));

      await renderPage(store);

      fireEvent.click(screen.getByTestId('perps-modify-cta-button'));

      const modifyMenu = screen.getByTestId('perps-modify-menu');
      expect(modifyMenu).toBeInTheDocument();
      expect(modifyMenu.parentElement).toBe(document.body);
      expect(
        screen.getByTestId('perps-modify-menu-add-exposure'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('perps-modify-menu-reduce-exposure'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('perps-modify-menu-reverse-position'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsAddExposure.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsReduceExposure.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsReversePosition.message),
      ).toBeInTheDocument();
    });

    it('opens Margin menu with Add margin and Remove margin when Margin card is clicked', async () => {
      const store = mockStore(createMockState(true));

      await renderPage(store);

      fireEvent.click(screen.getByTestId('perps-margin-card'));
      const marginMenu = screen.getByTestId('perps-margin-menu');
      expect(marginMenu).toBeInTheDocument();
      expect(marginMenu.parentElement).toBe(document.body);
      expect(
        screen.getByText(messages.perpsAddMargin.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsRemoveMargin.message),
      ).toBeInTheDocument();
    });

    it('opens Close position modal when Close button is clicked', async () => {
      const store = mockStore(createMockState(true));

      await renderPage(store);

      fireEvent.click(screen.getByTestId('perps-close-cta-button'));
      expect(
        screen.getByTestId('perps-close-position-modal'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsAvailableToClose.message),
      ).toBeInTheDocument();
    });

    it('navigates to order entry in modify mode when Add exposure is clicked', async () => {
      const store = mockStore(createMockState(true));

      await renderPage(store);

      fireEvent.click(screen.getByTestId('perps-modify-cta-button'));
      fireEvent.click(screen.getByTestId('perps-modify-menu-add-exposure'));

      expect(mockUseNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/perps/trade/ETH'),
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(
        expect.stringContaining('mode=modify'),
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(
        expect.stringContaining('direction=long'),
      );
    });

    it('shows cross-margin toast and does not navigate when Add exposure is clicked on a cross-margin position', async () => {
      const crossPosition = {
        ...mockPositions[0],
        leverage: { type: 'cross' as const, value: 5 },
      };
      mockLivePositions.mockReturnValue({
        positions: [crossPosition, ...mockPositions.slice(1)],
        isInitialLoading: false,
      });
      const store = mockStore(createMockState(true));

      await renderPage(store);

      fireEvent.click(screen.getByTestId('perps-modify-cta-button'));
      fireEvent.click(screen.getByTestId('perps-modify-menu-add-exposure'));

      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsCrossMarginNotSupportedTitle',
        description: messages.perpsCrossMarginNotSupportedDescription.message,
      });
      expect(mockUseNavigate).not.toHaveBeenCalledWith(
        expect.stringContaining('mode=modify'),
      );
    });

    it('opens Close position modal when Reduce exposure is clicked', async () => {
      const store = mockStore(createMockState(true));

      await renderPage(store);

      fireEvent.click(screen.getByTestId('perps-modify-cta-button'));
      fireEvent.click(screen.getByTestId('perps-modify-menu-reduce-exposure'));

      expect(
        screen.getByTestId('perps-close-position-modal'),
      ).toBeInTheDocument();
    });

    it('opens Reverse position modal when Reverse position is clicked', async () => {
      const store = mockStore(createMockState(true));

      await renderPage(store);

      fireEvent.click(screen.getByTestId('perps-modify-cta-button'));
      fireEvent.click(screen.getByTestId('perps-modify-menu-reverse-position'));

      expect(
        screen.getByTestId('perps-reverse-position-modal'),
      ).toBeInTheDocument();
    });

    it('opens Add margin modal from Margin menu', async () => {
      const store = mockStore(createMockState(true));

      await renderPage(store);

      fireEvent.click(screen.getByTestId('perps-margin-card'));
      fireEvent.click(screen.getByTestId('perps-margin-menu-add'));

      expect(screen.getByTestId('perps-add-margin-modal')).toBeInTheDocument();
    });

    it('opens Remove margin modal from Margin menu', async () => {
      const store = mockStore(createMockState(true));

      await renderPage(store);

      fireEvent.click(screen.getByTestId('perps-margin-card'));
      fireEvent.click(screen.getByTestId('perps-margin-menu-remove'));

      expect(
        screen.getByTestId('perps-decrease-margin-modal'),
      ).toBeInTheDocument();
    });

    it('updates the selected candle period from the More menu', async () => {
      const store = mockStore(createMockState(true));

      await renderPage(store);

      fireEvent.click(screen.getByTestId('perps-candle-period-more'));

      expect(
        screen.getByTestId('perps-candle-period-modal'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsCandleIntervals.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsCandlePeriodMinutes.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsCandlePeriodHours.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsCandlePeriodDays.message),
      ).toBeInTheDocument();

      const morePeriodOption = screen.getByTestId(
        'perps-candle-period-modal-30m',
      );
      expect(morePeriodOption).toBeInTheDocument();

      fireEvent.click(morePeriodOption);

      expect(screen.getByText('30min')).toBeInTheDocument();
      expect(
        screen.queryByTestId('perps-candle-period-modal'),
      ).not.toBeInTheDocument();
    });

    it('does not mark 1min as selected after selecting 1M from the modal', async () => {
      const store = mockStore(createMockState(true));

      await renderPage(store);

      fireEvent.click(screen.getByTestId('perps-candle-period-more'));
      fireEvent.click(screen.getByTestId('perps-candle-period-modal-1M'));

      expect(screen.getByText('1M')).toBeInTheDocument();
      expect(screen.getByTestId('perps-candle-period-more')).toHaveClass(
        'bg-muted',
      );
      expect(screen.getByTestId('perps-candle-period-1m')).not.toHaveClass(
        'bg-muted',
      );
    });

    it('closes the candle period modal when the close button is clicked', async () => {
      const store = mockStore(createMockState(true));

      await renderPage(store);

      fireEvent.click(screen.getByTestId('perps-candle-period-more'));
      fireEvent.click(screen.getByLabelText(messages.close.message));

      expect(
        screen.queryByTestId('perps-candle-period-modal'),
      ).not.toBeInTheDocument();
    });

    it('displays Close Long button text for long position', async () => {
      const store = mockStore(createMockState(true));

      await renderPage(store);

      expect(
        screen.getByText(messages.perpsCloseLong.message),
      ).toBeInTheDocument();
    });

    it('displays Close Short button text for short position', async () => {
      mockUseParams.mockReturnValue({ symbol: 'BTC' });
      const store = mockStore(createMockState(true));

      await renderPage(store);

      expect(
        screen.getByText(messages.perpsCloseShort.message),
      ).toBeInTheDocument();
    });

    it('shows short-specific descriptions in Modify menu for short position', async () => {
      mockUseParams.mockReturnValue({ symbol: 'BTC' });
      const store = mockStore(createMockState(true));

      await renderPage(store);

      fireEvent.click(screen.getByTestId('perps-modify-cta-button'));

      expect(
        screen.getByText(messages.perpsAddExposureDescriptionShort.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsReduceExposureDescriptionShort.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsReversePositionDescriptionShort.message),
      ).toBeInTheDocument();
    });

    it('displays disclaimer text', async () => {
      const store = mockStore(createMockState(true));

      await renderPage(store);

      expect(
        screen.getByText(messages.perpsDisclaimer.message),
      ).toBeInTheDocument();
    });

    it('opens TP/SL modal when Auto Close row is clicked', async () => {
      const store = mockStore(createMockState(true));

      await renderPage(store);

      fireEvent.click(screen.getByTestId('perps-auto-close-row'));
      expect(
        screen.getByText(messages.perpsTakeProfit.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsStopLoss.message),
      ).toBeInTheDocument();
    });

    it('populates TP price from preset button for long position', async () => {
      const store = mockStore(createMockState(true));
      await renderPage(store);

      fireEvent.click(screen.getByText(messages.perpsAutoClose.message));

      // After expand, TP input is initialized to position's existing TP (3200.00)
      expect(screen.getByDisplayValue('3200.00')).toBeInTheDocument();

      // ETH is long, entry=2850, leverage=3.
      // RoE formula: targetPrice = 2850 * (1 + 25/(3*100)) = 2850 * 1.08333 = 3087.50
      const presetButton = screen.getByText('+25%').closest('[class]');
      fireEvent.click(presetButton as HTMLElement);

      expect(screen.getByDisplayValue('3087.50')).toBeInTheDocument();
    });

    it('populates SL price from preset button for long position', async () => {
      const store = mockStore(createMockState(true));
      await renderPage(store);

      fireEvent.click(screen.getByText(messages.perpsAutoClose.message));

      // After expand, SL input is initialized to position's existing SL (2600.00)
      expect(screen.getByDisplayValue('2600.00')).toBeInTheDocument();

      // ETH is long, entry=2850, leverage=3.
      // RoE formula: targetPrice = 2850 * (1 - 25/(3*100)) = 2850 * 0.91667 = 2612.50
      const presetButton = screen.getByText('-25%').closest('[class]');
      fireEvent.click(presetButton as HTMLElement);

      expect(screen.getByDisplayValue('2612.50')).toBeInTheDocument();
    });

    it('populates TP price from preset button for short position', async () => {
      // BTC is short (size=-0.5), entry=45,000, leverage=15
      mockUseParams.mockReturnValue({ symbol: 'BTC' });
      const store = mockStore(createMockState(true));
      await renderPage(store);

      fireEvent.click(screen.getByText(messages.perpsAutoClose.message));

      // RoE formula (short TP): targetPrice = 45000 * (1 - 10/(15*100)) = 45000 * 0.99333 = 44700.00
      const presetButton = screen.getByText('+10%').closest('[class]');
      fireEvent.click(presetButton as HTMLElement);

      expect(screen.getByDisplayValue('44700.00')).toBeInTheDocument();
    });

    it('populates SL price from preset button for short position', async () => {
      // BTC is short (size=-0.5), entry=45,000, leverage=15
      mockUseParams.mockReturnValue({ symbol: 'BTC' });
      const store = mockStore(createMockState(true));
      await renderPage(store);

      fireEvent.click(screen.getByText(messages.perpsAutoClose.message));

      // RoE formula (short SL): targetPrice = 45000 * (1 + 10/(15*100)) = 45000 * 1.00667 = 45300.00
      const presetButton = screen.getByText('-10%').closest('[class]');
      fireEvent.click(presetButton as HTMLElement);

      expect(screen.getByDisplayValue('45300.00')).toBeInTheDocument();
    });

    it('shows TP/SL success toast without in-progress toast when saving', async () => {
      const store = mockStore(createMockState(true));
      await renderPage(store);

      fireEvent.click(screen.getByText(messages.perpsAutoClose.message));

      await act(async () => {
        fireEvent.click(screen.getByText(messages.perpsSaveChanges.message));
      });

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsUpdatePositionTPSL',
          [
            expect.objectContaining({
              symbol: 'ETH',
            }),
          ],
        );
      });

      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastUpdateSuccess',
      });
      expect(mockReplacePerpsToastByKey).not.toHaveBeenCalledWith({
        key: 'perpsToastUpdateInProgress',
      });
    });

    it('shows TP/SL failure toast when saving fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsUpdatePositionTPSL') {
          return Promise.resolve({
            success: false,
            error: 'TP/SL rejected',
          });
        }
        return Promise.resolve({ success: true });
      });

      const store = mockStore(createMockState(true));
      await renderPage(store);

      fireEvent.click(screen.getByText(messages.perpsAutoClose.message));

      await act(async () => {
        fireEvent.click(screen.getByText(messages.perpsSaveChanges.message));
      });

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
          key: 'perpsToastUpdateFailed',
          description: 'TP/SL rejected',
        });
      });

      expect(screen.queryByText('TP/SL rejected')).not.toBeInTheDocument();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('when user has no position on the viewed market', () => {
    it('shows Long and Short trade buttons instead of Modify/Close', async () => {
      mockUseParams.mockReturnValue({ symbol: 'xyz:AAPL' });
      const store = mockStore(createMockState(true));

      await renderPage(store);

      expect(screen.getByTestId('perps-trade-cta-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('perps-long-cta-button')).toBeInTheDocument();
      expect(screen.getByTestId('perps-short-cta-button')).toBeInTheDocument();
      expect(
        screen.queryByTestId('perps-modify-cta-button'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('perps-close-cta-button'),
      ).not.toBeInTheDocument();
    });

    it('shows Long/Short buttons even when balance is zero', async () => {
      mockUseParams.mockReturnValue({ symbol: 'xyz:AAPL' });
      mockLiveAccount.mockReturnValue({
        account: {
          ...mockAccountState,
          availableBalance: '0',
          totalBalance: '0',
        },
        isInitialLoading: false,
      });
      const store = mockStore(createMockState(true));

      await renderPage(store);

      expect(screen.getByTestId('perps-trade-cta-buttons')).toBeInTheDocument();
      expect(screen.getByTestId('perps-long-cta-button')).toBeInTheDocument();
      expect(screen.getByTestId('perps-short-cta-button')).toBeInTheDocument();
    });

    it('navigates to order entry when Long button is clicked', async () => {
      mockUseParams.mockReturnValue({ symbol: 'xyz:AAPL' });
      const store = mockStore(createMockState(true));

      await renderPage(store);

      fireEvent.click(screen.getByTestId('perps-long-cta-button'));

      expect(mockUseNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/direction=long/u),
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/mode=new/u),
      );
    });

    it('navigates to order entry when Short button is clicked', async () => {
      mockUseParams.mockReturnValue({ symbol: 'xyz:AAPL' });
      const store = mockStore(createMockState(true));

      await renderPage(store);

      fireEvent.click(screen.getByTestId('perps-short-cta-button'));

      expect(mockUseNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/direction=short/u),
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/mode=new/u),
      );
    });

    it('does not render position section', async () => {
      mockUseParams.mockReturnValue({ symbol: 'xyz:AAPL' });
      const store = mockStore(createMockState(true));

      await renderPage(store);

      expect(
        screen.queryByText(messages.perpsPosition.message),
      ).not.toBeInTheDocument();
    });

    it('keeps trade buttons disabled while account state is loading', async () => {
      mockUseParams.mockReturnValue({ symbol: 'xyz:AAPL' });
      mockLiveAccount.mockReturnValue({
        account: mockAccountState,
        isInitialLoading: true,
      });
      const store = mockStore(createMockState(true));

      await renderPage(store);

      expect(screen.getByTestId('perps-long-cta-button')).toBeDisabled();
      expect(screen.getByTestId('perps-short-cta-button')).toBeDisabled();
    });
  });

  describe('when market is not found', () => {
    it('renders error state for unknown market', async () => {
      mockUseParams.mockReturnValue({ symbol: 'UNKNOWN_MARKET_XYZ' });
      const store = mockStore(createMockState(true));

      const { getByText } = await renderPage(store);

      expect(
        getByText(messages.perpsMarketNotFound.message),
      ).toBeInTheDocument();
    });

    it('displays the unknown market symbol in error message', async () => {
      mockUseParams.mockReturnValue({ symbol: 'NONEXISTENT' });
      const store = mockStore(createMockState(true));

      const { getByText } = await renderPage(store);

      expect(
        getByText(/The market "NONEXISTENT" could not be found/u),
      ).toBeInTheDocument();
    });

    it('displays back button on error state', async () => {
      mockUseParams.mockReturnValue({ symbol: 'UNKNOWN' });
      const store = mockStore(createMockState(true));

      const { getByTestId } = await renderPage(store);

      expect(
        getByTestId('perps-market-detail-back-button'),
      ).toBeInTheDocument();
    });
  });

  describe('when perps feature is disabled', () => {
    it('redirects to home when perps is disabled', async () => {
      const store = mockStore(createMockState(false));

      await renderPage(store);

      expect(mockNavigateComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '/',
          replace: true,
        }),
      );
    });
  });

  describe('when no symbol is provided', () => {
    it('redirects to home when symbol is undefined', async () => {
      mockUseParams.mockReturnValue({ symbol: undefined });
      const store = mockStore(createMockState(true));

      await renderPage(store);

      expect(mockNavigateComponent).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '/',
          replace: true,
        }),
      );
    });
  });

  describe('cancel order modal', () => {
    it('does not render cancel order modal before an order card is clicked', () => {
      const store = mockStore(createMockState(true));
      renderWithProvider(<PerpsMarketDetailPage />, store);

      expect(
        screen.queryByTestId('perps-cancel-order-modal'),
      ).not.toBeInTheDocument();
    });

    it('opens cancel order modal when an order card is clicked', () => {
      const store = mockStore(createMockState(true));
      renderWithProvider(<PerpsMarketDetailPage />, store);

      // ETH has order-001 (buy limit) in mockOrders
      const orderCard = screen.getByTestId('order-card-order-001');
      fireEvent.click(orderCard);

      expect(
        screen.getByTestId('perps-cancel-order-modal'),
      ).toBeInTheDocument();
    });

    it('displays "Cancel order" button inside the modal', () => {
      const store = mockStore(createMockState(true));
      renderWithProvider(<PerpsMarketDetailPage />, store);

      fireEvent.click(screen.getByTestId('order-card-order-001'));

      expect(
        screen.getByTestId('perps-cancel-order-button'),
      ).toBeInTheDocument();
    });

    it('closes the cancel order modal when the close button is pressed', () => {
      const store = mockStore(createMockState(true));
      renderWithProvider(<PerpsMarketDetailPage />, store);

      fireEvent.click(screen.getByTestId('order-card-order-001'));
      expect(
        screen.getByTestId('perps-cancel-order-modal'),
      ).toBeInTheDocument();

      // ModalHeader renders a close button with localized aria-label
      const closeButton = screen.getByLabelText(messages.close.message);
      fireEvent.click(closeButton);

      expect(
        screen.queryByTestId('perps-cancel-order-modal'),
      ).not.toBeInTheDocument();
    });

    it('submits perpsCancelOrder with the correct orderId and symbol', async () => {
      const store = mockStore(createMockState(true));
      renderWithProvider(<PerpsMarketDetailPage />, store);

      fireEvent.click(screen.getByTestId('order-card-order-001'));
      fireEvent.click(screen.getByTestId('perps-cancel-order-button'));

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsCancelOrder',
          [{ orderId: 'order-001', symbol: 'ETH' }],
        );
      });
    });

    it('closes modal after successful cancel', async () => {
      mockSubmitRequestToBackground.mockResolvedValue({ success: true });
      const store = mockStore(createMockState(true));
      renderWithProvider(<PerpsMarketDetailPage />, store);

      fireEvent.click(screen.getByTestId('order-card-order-001'));
      expect(
        screen.getByTestId('perps-cancel-order-modal'),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('perps-cancel-order-button'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('perps-cancel-order-modal'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('geo-blocking', () => {
    it('shows geo-block modal when clicking Long while not eligible', async () => {
      mockUsePerpsEligibility.mockReturnValue({ isEligible: false });
      mockUseParams.mockReturnValue({ symbol: 'xyz:AAPL' });
      const store = mockStore(createMockState(true));
      await renderPage(store);

      const longButton = screen.getByTestId('perps-long-cta-button');
      fireEvent.click(longButton);

      await waitFor(() => {
        expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
      });
      expect(mockUseNavigate).not.toHaveBeenCalled();
    });

    it('shows geo-block modal when clicking Short while not eligible', async () => {
      mockUsePerpsEligibility.mockReturnValue({ isEligible: false });
      mockUseParams.mockReturnValue({ symbol: 'xyz:AAPL' });
      const store = mockStore(createMockState(true));
      await renderPage(store);

      const shortButton = screen.getByTestId('perps-short-cta-button');
      fireEvent.click(shortButton);

      await waitFor(() => {
        expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
      });
      expect(mockUseNavigate).not.toHaveBeenCalled();
    });

    it('shows geo-block modal when clicking Close while not eligible', async () => {
      mockUsePerpsEligibility.mockReturnValue({ isEligible: false });
      const store = mockStore(createMockState(true));
      await renderPage(store);

      const closeButton = screen.getByTestId('perps-close-cta-button');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
      });
    });

    it('shows geo-block modal when clicking Modify while not eligible', async () => {
      mockUsePerpsEligibility.mockReturnValue({ isEligible: false });
      const store = mockStore(createMockState(true));
      await renderPage(store);

      const modifyButton = screen.getByTestId('perps-modify-cta-button');
      fireEvent.click(modifyButton);

      await waitFor(() => {
        expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
      });
    });
  });
});
