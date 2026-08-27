import type {
  AccountState,
  OrderBookData,
  Position,
  PerpsMarketData,
} from '@metamask/perps-controller';
import {
  screen,
  fireEvent,
  act,
  waitFor,
  within,
} from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import mockState from '../../../test/data/mock-state.json';
import { enLocale as messages, tEn } from '../../../test/lib/i18n-helpers';
import { PERPS_MIN_MARKET_ORDER_USD } from '../../components/app/perps/constants';
import { bpsToPercent } from '../../components/app/perps/constants/slippageConfig';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../shared/constants/perps-events';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import {
  mockPositions,
  mockAccountState,
  mockCryptoMarkets,
  mockHip3Markets,
} from '../../components/app/perps/mocks';
import type { UsePerpsMaxSlippageReturn } from '../../hooks/perps/usePerpsMaxSlippage';
import PerpsOrderEntryPage, {
  shouldShowPerpsOrderSubmissionToasts,
} from './perps-order-entry-page';

const mockAnalyticsTrackEvent = jest.fn();

jest.mock('../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockAnalyticsTrackEvent,
      createEventBuilder,
    }),
  };
});

// Mobile test convention: mock the Compliance barrel so the gate hook never runs
// (and never reaches the now-strict AccessRestrictedProvider context throw). The
// default gate is a passthrough; the blocked case is simulated per-test below.
const mockComplianceGate = jest.fn(async (action: () => unknown) => action());
jest.mock('../../components/app/compliance', () => ({
  useComplianceGate: () => ({
    gate: mockComplianceGate,
    isComplianceEnabled: false,
    isBlocked: false,
    checkCompliance: jest.fn(),
  }),
  useSelectedAccountComplianceGate: () => ({
    gate: mockComplianceGate,
    isComplianceEnabled: false,
    isBlocked: false,
    checkCompliance: jest.fn(),
  }),
}));

const mockUsePerpsMarketInfo = jest.fn(() => undefined);

jest.mock('../../hooks/perps/usePerpsAttribution', () => ({
  usePerpsAttribution: () => ({
    buildTrackingData: (input: Record<string, unknown>) => input,
    buildTpslTrackingData: (input: Record<string, unknown>) => input,
    setFlowAttribution: jest.fn(),
  }),
}));

const enterAmount = (value: string) => {
  const amountContainer = screen.getByTestId('amount-input-field');
  const amountInput = amountContainer.querySelector(
    'input',
  ) as HTMLInputElement;
  fireEvent.change(amountInput, { target: { value } });
};

jest.mock('@metamask/perps-controller', () => ({
  ...jest.requireActual('@metamask/perps-controller'),
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

const mockUsePerpsEligibility = jest.fn(() => ({ isEligible: true }));
jest.mock('../../hooks/perps/usePerpsEligibility', () => ({
  usePerpsEligibility: () => mockUsePerpsEligibility(),
}));

jest.mock('../../hooks/perps/usePerpsMarketInfo', () => ({
  usePerpsMarketInfo: () => mockUsePerpsMarketInfo(),
}));

jest.mock('../../hooks/perps/usePerpsOrderFees', () => ({
  ...jest.requireActual('../../hooks/perps/usePerpsOrderFees'),
  usePerpsOrderFees: () => ({
    // combined = protocol + discounted builder; hl_fee_rate must report only
    // the protocol part.
    feeRate: 0.00145,
    protocolFeeRate: 0.00045,
    isLoading: false,
  }),
}));

const mockUsePerpsEstimatedSlippage = jest.fn(() => ({
  estimatedSlippageBps: 50 as number | null,
  isReady: true,
}));
const mockUsePerpsMaxSlippage = jest.fn(
  (): UsePerpsMaxSlippageReturn => ({
    maxSlippageBps: 300,
    maxSlippageSource: 'default',
    setMaxSlippage: jest.fn(),
    isLoading: false,
  }),
);

jest.mock('../../hooks/perps/usePerpsEstimatedSlippage', () => ({
  usePerpsEstimatedSlippage: () => mockUsePerpsEstimatedSlippage(),
}));

jest.mock('../../hooks/perps/usePerpsMaxSlippage', () => ({
  usePerpsMaxSlippage: () => mockUsePerpsMaxSlippage(),
}));

const mockStreamManagerBase = {
  positions: {
    getCachedData: () => [],
    pushData: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
  },
  orders: { getCachedData: () => [], pushData: jest.fn() },
  account: { getCachedData: () => null, pushData: jest.fn() },
  markets: { getCachedData: () => [], pushData: jest.fn() },
  prices: { subscribe: jest.fn(() => jest.fn()), getCachedData: () => [] },
  orderBook: {
    subscribe: jest.fn(() => jest.fn()),
    getCachedData: () => null,
    clearCache: jest.fn(),
  },
  orderBookAggregated: {
    subscribe: jest.fn(() => jest.fn()),
    getCachedData: () => null,
    clearCache: jest.fn(),
  },
  orderBookAggregatedStatus: {
    subscribe: jest.fn(() => jest.fn()),
    getCachedData: () => 'connecting',
    clearCache: jest.fn(),
  },
  setOptimisticTPSL: jest.fn(),
  clearOptimisticTPSL: jest.fn(),
  pushPositionsWithOverrides: jest.fn(),
  prewarm: jest.fn(),
  cleanupPrewarm: jest.fn(),
  isInitialized: () => true,
  init: jest.fn(),
};
const mockGetPerpsStreamManager = jest.fn(() => mockStreamManagerBase);

const mockSubmitRequestToBackground = jest.fn().mockResolvedValue(undefined);
jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

const mockReplacePerpsToastByKey = jest.fn();
const mockHidePerpsToast = jest.fn();
const mockSetPendingOrder = jest.fn();
const mockTriggerDeposit = jest.fn().mockResolvedValue({
  transactionId: 'perps-deposit-tx',
});
jest.mock('../../components/app/perps/perps-toast', () => {
  const { PERPS_TOAST_KEYS } = jest.requireActual(
    '../../components/app/perps/perps-toast/perps-toast-provider',
  );

  return {
    PERPS_TOAST_KEYS,
    usePerpsToast: () => ({
      replacePerpsToastByKey: mockReplacePerpsToastByKey,
      hidePerpsToast: mockHidePerpsToast,
      setPendingOrder: mockSetPendingOrder,
      pendingOrder: null,
    }),
  };
});
jest.mock('../../providers/perps', () => {
  return {
    getPerpsStreamManager: () => mockGetPerpsStreamManager(),
  };
});
jest.mock(
  '../../components/app/perps/hooks/usePerpsDepositConfirmation',
  () => ({
    usePerpsDepositConfirmation: () => ({
      trigger: mockTriggerDeposit,
      isLoading: false,
    }),
  }),
);

const mockLivePositions = jest.fn<
  { positions: Position[]; isInitialLoading: boolean },
  []
>(() => ({
  positions: [],
  isInitialLoading: false,
}));
const mockLiveAccount = jest.fn<
  { account: AccountState | null; isInitialLoading: boolean },
  []
>(() => ({
  account: mockAccountState,
  isInitialLoading: false,
}));
const mockLiveMarketData = jest.fn<
  { markets: PerpsMarketData[]; isInitialLoading: boolean },
  []
>(() => ({
  markets: [...mockCryptoMarkets, ...mockHip3Markets],
  isInitialLoading: false,
}));

const mockUsePerpsLiveOrderBook = jest.fn(() => ({
  orderBook: null as OrderBookData | null,
  isInitialLoading: false,
  connectionStatus: 'connected' as const,
  reconnect: jest.fn(),
}));

jest.mock('../../hooks/perps/stream', () => ({
  usePerpsLivePositions: () => mockLivePositions(),
  usePerpsLiveOrders: () => ({
    orders: [],
    isInitialLoading: false,
  }),
  usePerpsLiveAccount: () => mockLiveAccount(),
  usePerpsLiveMarketData: () => mockLiveMarketData(),
  usePerpsLiveCandles: () => ({
    candleData: {
      symbol: 'ETH',
      interval: '5m',
      candles: [],
    },
    isInitialLoading: false,
    isLoadingMore: false,
    hasHistoricalData: false,
    error: null,
    fetchMoreHistory: jest.fn(),
  }),
  usePerpsLiveOrderBook: () => mockUsePerpsLiveOrderBook(),
}));

jest.mock('../../hooks/perps/useUserHistory', () => ({
  useUserHistory: () => ({
    userHistory: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('../../hooks/perps/usePerpsTransactionHistory', () => ({
  usePerpsTransactionHistory: () => ({
    transactions: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

const mockUseParams = jest.fn().mockReturnValue({ symbol: 'ETH' });
const mockUseNavigate = jest.fn();
const mockNavigateComponent = jest.fn();
const mockSearchParams = new URLSearchParams();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
  useParams: () => mockUseParams(),
  useSearchParams: () => [mockSearchParams],
  Navigate: (props: { to: string; replace?: boolean }) => {
    mockNavigateComponent(props);
    return null;
  },
}));

const mockIsNearLiquidationPrice = jest.fn();
jest.mock('../../components/app/perps/order-entry/limit-price-warnings', () => {
  const actual = jest.requireActual(
    '../../components/app/perps/order-entry/limit-price-warnings',
  );
  return {
    ...actual,
    isNearLiquidationPrice: (...args: unknown[]) =>
      mockIsNearLiquidationPrice(...args),
  };
});
describe('PerpsOrderEntryPage', () => {
  const middlewares = [thunk];
  const mockStore = configureMockStore(middlewares);

  const createMockState = (perpsEnabled = true) => ({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      remoteFeatureFlags: {
        ...mockState.metamask.remoteFeatureFlags,
        perpsEnabledVersion: perpsEnabled
          ? { enabled: true, minimumVersion: '0.0.0' }
          : { enabled: false, minimumVersion: '99.99.99' },
        perpsSlippageConfig2: { enabled: true, minimumVersion: '0.0.0' },
        perpsOrderBookEnabled: { enabled: true, minimumVersion: '0.0.0' },
      },
    },
  });

  const createMockStateWithOrderBookPosition = (
    orderBookPosition: 'left' | 'right',
  ) => {
    const state = createMockState();
    return {
      ...state,
      metamask: {
        ...state.metamask,
        proLayoutPreferences: { orderBookPosition },
      },
    };
  };

  const createMockStateWithLocale = (
    locale: string,
    perpsEnabled = true,
  ): ReturnType<typeof createMockState> => ({
    ...createMockState(perpsEnabled),
    localeMessages: {
      ...(createMockState(perpsEnabled).localeMessages ?? {}),
      currentLocale: locale,
    },
  });

  afterEach(async () => {
    // The abandon emit is deferred one macrotask (StrictMode probe guard). RTL
    // has already unmounted by now, so drain it here — otherwise it fires
    // inside the NEXT test, after its beforeEach cleared the mocks.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsEligibility.mockReturnValue({ isEligible: true });
    const { isNearLiquidationPrice: realIsNearLiquidation } =
      jest.requireActual(
        '../../components/app/perps/order-entry/limit-price-warnings',
      );
    mockIsNearLiquidationPrice.mockImplementation(realIsNearLiquidation);
    mockReplacePerpsToastByKey.mockReset();
    mockHidePerpsToast.mockReset();
    mockTriggerDeposit.mockClear();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
    mockUseParams.mockReturnValue({ symbol: 'ETH' });
    mockSearchParams.delete('direction');
    mockSearchParams.delete('mode');
    mockSearchParams.delete('orderType');
    mockLivePositions.mockReturnValue({
      positions: [],
      isInitialLoading: false,
    });
    mockUsePerpsMarketInfo.mockReturnValue(undefined);
    mockLiveAccount.mockReturnValue({
      account: mockAccountState,
      isInitialLoading: false,
    });
    mockLiveMarketData.mockReturnValue({
      markets: [...mockCryptoMarkets, ...mockHip3Markets],
      isInitialLoading: false,
    });
    mockUsePerpsLiveOrderBook.mockReturnValue({
      orderBook: null,
      isInitialLoading: false,
      connectionStatus: 'connected',
      reconnect: jest.fn(),
    });
    mockUsePerpsEstimatedSlippage.mockReturnValue({
      estimatedSlippageBps: 50,
      isReady: true,
    });
    mockUsePerpsMaxSlippage.mockReturnValue({
      maxSlippageBps: 300,
      maxSlippageSource: 'default',
      setMaxSlippage: jest.fn(),
      isLoading: false,
    });
  });

  describe('shouldShowPerpsOrderSubmissionToasts', () => {
    it('returns true when there is no active pending perps deposit', () => {
      expect(shouldShowPerpsOrderSubmissionToasts(false)).toBe(true);
    });

    it('returns false when a pending perps deposit already owns the flow', () => {
      expect(shouldShowPerpsOrderSubmissionToasts(true)).toBe(false);
    });
  });

  describe('order book layout position', () => {
    // The panes are reordered in the DOM, so document order is also the
    // keyboard and screen-reader order. Asserting index within the body keeps
    // these tests on the accessible outcome rather than on a CSS property.
    const readPaneOrder = () => {
      const body = screen.getByTestId('perps-order-body');
      const children = Array.from(body.children);
      const indexOf = (el: Element | null) =>
        children.findIndex((child) => child === el || child.contains(el));

      return {
        form: indexOf(screen.getByTestId('submit-order-button')),
        divider: indexOf(screen.getByTestId('perps-order-book-resize-handle')),
        orderBook: indexOf(screen.getByTestId('perps-order-book')),
      };
    };

    it('places the order book before the divider and form in the DOM when orderBookPosition is left', () => {
      const store = mockStore(createMockStateWithOrderBookPosition('left'));
      renderWithProvider(<PerpsOrderEntryPage />, store);
      fireEvent.click(screen.getByTestId('perps-order-book-toggle'));

      const { form, divider, orderBook } = readPaneOrder();
      expect(orderBook).toBeLessThan(divider);
      expect(divider).toBeLessThan(form);
    });

    it('places the form before the divider and order book in the DOM when orderBookPosition is right', () => {
      const store = mockStore(createMockStateWithOrderBookPosition('right'));
      renderWithProvider(<PerpsOrderEntryPage />, store);
      fireEvent.click(screen.getByTestId('perps-order-book-toggle'));

      const { form, divider, orderBook } = readPaneOrder();
      expect(form).toBeLessThan(divider);
      expect(divider).toBeLessThan(orderBook);
    });

    it('defaults to the left position when no preference is persisted', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);
      fireEvent.click(screen.getByTestId('perps-order-book-toggle'));

      const { form, orderBook } = readPaneOrder();
      expect(orderBook).toBeLessThan(form);
    });

    it('moves the panes without remounting them when the preference changes', () => {
      let orderBookPosition: 'left' | 'right' = 'right';
      const base = createMockState();
      const store = mockStore(() => ({
        ...base,
        metamask: {
          ...base.metamask,
          proLayoutPreferences: { orderBookPosition },
        },
      }));

      renderWithProvider(<PerpsOrderEntryPage />, store);
      fireEvent.click(screen.getByTestId('perps-order-book-toggle'));

      const before = readPaneOrder();
      expect(before.form).toBeLessThan(before.orderBook);
      const orderBookNode = screen.getByTestId('perps-order-book');

      orderBookPosition = 'left';
      act(() => {
        store.dispatch({ type: 'test/layout-preference-changed' });
      });

      // The panes swapped...
      const after = readPaneOrder();
      expect(after.orderBook).toBeLessThan(after.form);
      // ...but it is the same DOM node, so React moved it rather than
      // unmounting it. A remount here would discard a part-filled order form.
      expect(screen.getByTestId('perps-order-book')).toBe(orderBookNode);
    });

    it('does not reorder with CSS, so overflow stays on the scrollable side', () => {
      const store = mockStore(createMockStateWithOrderBookPosition('left'));
      renderWithProvider(<PerpsOrderEntryPage />, store);
      fireEvent.click(screen.getByTestId('perps-order-book-toggle'));

      const body = screen.getByTestId('perps-order-body');
      expect(body.className).not.toContain('flex-row-reverse');
      Array.from(body.children).forEach((child) =>
        expect((child as HTMLElement).style.order).toBe(''),
      );
    });
  });

  describe('rendering', () => {
    it('renders the page with order entry form', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(
        screen.getByTestId('parent-selector-perps-order-entry'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('order-entry')).toBeInTheDocument();
    });

    it('renders the back button', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(
        screen.getByTestId('perps-order-entry-back-button'),
      ).toBeInTheDocument();
    });

    it('renders the submit button with Open Long text by default', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);
      enterAmount('100');

      expect(screen.getByTestId('submit-order-button')).toHaveTextContent(
        'Open long ETH',
      );
    });

    it('renders the direction tabs', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(screen.getByText(messages.perpsLong.message)).toBeInTheDocument();
      expect(screen.getByText(messages.perpsShort.message)).toBeInTheDocument();
    });

    it('does not render direction tabs in modify mode', () => {
      mockSearchParams.set('mode', 'modify');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(screen.queryByTestId('direction-tabs')).not.toBeInTheDocument();
    });

    it('does not render direction tabs in close mode', () => {
      mockSearchParams.set('mode', 'close');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(screen.queryByTestId('direction-tabs')).not.toBeInTheDocument();
    });

    it('hides the auto-close section in modify mode', () => {
      mockSearchParams.set('mode', 'modify');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(screen.queryByTestId('auto-close-toggle')).not.toBeInTheDocument();
    });

    it('renders the order-size input with the default 0.00 placeholder (no "min $10")', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const amountInput = amountContainer.querySelector('input');
      expect(amountInput?.placeholder).toBe('0.00');
      expect(amountInput?.placeholder).not.toMatch(/min\s*\$/iu);
    });

    it('prefills the default testnet market order amount on new market orders', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const submitButton = screen.getByTestId('submit-order-button');
      const amountContainer = screen.getByTestId('amount-input-field');
      const amountInput = amountContainer.querySelector('input');

      expect(amountInput?.value).toBe('10');
      expect(submitButton).not.toBeDisabled();
    });

    it('disables submit when the user enters an amount below the $10 minimum', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      enterAmount('5');

      const submitButton = screen.getByTestId('submit-order-button');
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(
        tEn('perpsMinOrderSize', [`$${PERPS_MIN_MARKET_ORDER_USD}`]),
      );
    });
  });

  describe('order book toggle', () => {
    it('does not render the order book toggle when the feature flag is off', () => {
      const state = createMockState();
      state.metamask.remoteFeatureFlags.perpsOrderBookEnabled = {
        enabled: false,
        minimumVersion: '99.99.99',
      };
      const store = mockStore(state);
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(
        screen.queryByTestId('perps-order-book-toggle'),
      ).not.toBeInTheDocument();
    });

    it('mounts the order book and resize divider only after the toggle is pressed', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const toggle = screen.getByTestId('perps-order-book-toggle');
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
      expect(screen.queryByTestId('perps-order-book')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('perps-order-book-resize-handle'),
      ).not.toBeInTheDocument();

      fireEvent.click(toggle);

      expect(toggle).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('perps-order-book')).toBeInTheDocument();

      const divider = screen.getByTestId('perps-order-book-resize-handle');
      expect(divider).toHaveAttribute('role', 'separator');
      expect(divider).toHaveAttribute('aria-valuemin', '22');
      expect(divider).toHaveAttribute('aria-valuemax', '60');
      expect(divider).toHaveAttribute('aria-valuenow', '33');
    });

    it('mounts the order book already open when the persisted preference is expanded', () => {
      const state = createMockState();
      const store = mockStore({
        ...state,
        metamask: {
          ...state.metamask,
          proLayoutPreferences: { orderBookExpanded: true },
        },
      });
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(screen.getByTestId('perps-order-book-toggle')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByTestId('perps-order-book')).toBeInTheDocument();
    });

    it('persists the open state when the order book is toggled', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const toggle = screen.getByTestId('perps-order-book-toggle');

      fireEvent.click(toggle);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsSetProLayoutPreferences',
        [{ orderBookExpanded: true }],
      );

      fireEvent.click(toggle);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsSetProLayoutPreferences',
        [{ orderBookExpanded: false }],
      );
    });

    it('resizes the split within bounds using the keyboard', () => {
      const store = mockStore(createMockStateWithOrderBookPosition('right'));
      renderWithProvider(<PerpsOrderEntryPage />, store);

      fireEvent.click(screen.getByTestId('perps-order-book-toggle'));
      const divider = screen.getByTestId('perps-order-book-resize-handle');

      // Order book on the right: it grows leftward, so ArrowLeft widens it.
      fireEvent.keyDown(divider, { key: 'ArrowLeft' });
      expect(divider).toHaveAttribute('aria-valuenow', '35');

      fireEvent.keyDown(divider, { key: 'Home' });
      expect(divider).toHaveAttribute('aria-valuenow', '60');

      fireEvent.keyDown(divider, { key: 'End' });
      expect(divider).toHaveAttribute('aria-valuenow', '22');
    });

    it('flips the arrow keys when the order book is on the left', () => {
      const store = mockStore(createMockStateWithOrderBookPosition('left'));
      renderWithProvider(<PerpsOrderEntryPage />, store);

      fireEvent.click(screen.getByTestId('perps-order-book-toggle'));
      const divider = screen.getByTestId('perps-order-book-resize-handle');

      // The pane grows rightward now, so the arrows swap roles.
      fireEvent.keyDown(divider, { key: 'ArrowRight' });
      expect(divider).toHaveAttribute('aria-valuenow', '35');

      fireEvent.keyDown(divider, { key: 'ArrowLeft' });
      expect(divider).toHaveAttribute('aria-valuenow', '33');

      // Home/End remain position-independent (widest / narrowest).
      fireEvent.keyDown(divider, { key: 'Home' });
      expect(divider).toHaveAttribute('aria-valuenow', '60');

      fireEvent.keyDown(divider, { key: 'End' });
      expect(divider).toHaveAttribute('aria-valuenow', '22');
    });

    it('focuses the divider on mousedown so arrow keys can fine-tune the drag', () => {
      // Regression (a11y): preventDefault on mousedown also suppresses the
      // browser's default focus, leaving keyboard nudges unreachable after a drag.
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      fireEvent.click(screen.getByTestId('perps-order-book-toggle'));
      const divider = screen.getByTestId('perps-order-book-resize-handle');
      expect(divider).not.toHaveFocus();

      fireEvent.mouseDown(divider);

      expect(divider).toHaveFocus();
    });

    it('resizes the split within bounds by dragging the divider with the mouse', () => {
      // JSDOM reports a zero-sized rect by default; stub a real body geometry so
      // the pointer math produces a meaningful width percentage.
      const rectSpy = jest
        .spyOn(Element.prototype, 'getBoundingClientRect')
        .mockReturnValue({
          right: 1000,
          width: 1000,
          left: 0,
          top: 0,
          bottom: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect);

      try {
        const store = mockStore(createMockStateWithOrderBookPosition('right'));
        renderWithProvider(<PerpsOrderEntryPage />, store);

        fireEvent.click(screen.getByTestId('perps-order-book-toggle'));
        const divider = screen.getByTestId('perps-order-book-resize-handle');
        expect(divider).toHaveAttribute('aria-valuenow', '33');

        fireEvent.mouseDown(divider);
        // Pointer at body midpoint: (1000 - 500) / 1000 = 50%.
        fireEvent.mouseMove(window, { clientX: 500 });
        expect(divider).toHaveAttribute('aria-valuenow', '50');

        // Dragging past the max clamps to the upper bound.
        fireEvent.mouseMove(window, { clientX: 100 });
        expect(divider).toHaveAttribute('aria-valuenow', '60');

        // After releasing, further movement no longer resizes the split.
        fireEvent.mouseUp(window);
        fireEvent.mouseMove(window, { clientX: 900 });
        expect(divider).toHaveAttribute('aria-valuenow', '60');
      } finally {
        rectSpy.mockRestore();
      }
    });

    it('measures the drag from the left edge when the order book is on the left', () => {
      const rectSpy = jest
        .spyOn(Element.prototype, 'getBoundingClientRect')
        .mockReturnValue({
          right: 1000,
          width: 1000,
          left: 0,
          top: 0,
          bottom: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect);

      try {
        const store = mockStore(createMockStateWithOrderBookPosition('left'));
        renderWithProvider(<PerpsOrderEntryPage />, store);

        fireEvent.click(screen.getByTestId('perps-order-book-toggle'));
        const divider = screen.getByTestId('perps-order-book-resize-handle');

        fireEvent.mouseDown(divider);
        // Mirrored math: (500 - 0) / 1000 = 50%.
        fireEvent.mouseMove(window, { clientX: 500 });
        expect(divider).toHaveAttribute('aria-valuenow', '50');

        // Dragging toward the right edge (not the left) is what clamps now.
        fireEvent.mouseMove(window, { clientX: 900 });
        expect(divider).toHaveAttribute('aria-valuenow', '60');

        fireEvent.mouseMove(window, { clientX: 100 });
        expect(divider).toHaveAttribute('aria-valuenow', '22');
      } finally {
        rectSpy.mockRestore();
      }
    });

    it('caps the order book width on a narrow body so it cannot overflow off-screen', () => {
      // Regression: dragging the divider far left on a narrow popup previously
      // let the order book reach 60%, which (with the form's 224px pixel floor)
      // pushed the panel past the viewport. The width is now capped so the form
      // keeps its floor: (400 - 224 form - 2 divider) / 400 = 43.5% (rounds to
      // 44 for the aria value).
      const rectSpy = jest
        .spyOn(Element.prototype, 'getBoundingClientRect')
        .mockReturnValue({
          right: 400,
          width: 400,
          left: 0,
          top: 0,
          bottom: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect);

      try {
        const store = mockStore(createMockStateWithOrderBookPosition('right'));
        renderWithProvider(<PerpsOrderEntryPage />, store);

        fireEvent.click(screen.getByTestId('perps-order-book-toggle'));
        const divider = screen.getByTestId('perps-order-book-resize-handle');

        fireEvent.mouseDown(divider);
        // Drag all the way to the left edge (would be 100% without the cap).
        fireEvent.mouseMove(window, { clientX: 0 });
        expect(divider).toHaveAttribute('aria-valuenow', '44');
        // Assistive tech must announce the same pixel-aware ceiling used by the
        // clamp (~43.5%), not the constant 60% percentage max.
        expect(divider).toHaveAttribute('aria-valuemax', '44');
      } finally {
        rectSpy.mockRestore();
      }
    });

    it('exposes the pixel-aware width ceiling on aria-valuemax for a 360px popup', () => {
      // Regression (a11y): at 360px the reachable max is ~(360-224-2)/360 ≈ 37%,
      // but aria-valuemax previously always announced the constant 60%.
      const rectSpy = jest
        .spyOn(Element.prototype, 'getBoundingClientRect')
        .mockReturnValue({
          right: 360,
          width: 360,
          left: 0,
          top: 0,
          bottom: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect);

      const OriginalResizeObserver = window.ResizeObserver;
      window.ResizeObserver = class {
        #callback: ResizeObserverCallback;

        constructor(callback: ResizeObserverCallback) {
          this.#callback = callback;
        }

        observe(target: Element) {
          this.#callback(
            [
              {
                target,
                contentRect: target.getBoundingClientRect(),
                borderBoxSize: [],
                contentBoxSize: [],
                devicePixelContentBoxSize: [],
              },
            ],
            this,
          );
        }

        unobserve() {
          // no-op
        }

        disconnect() {
          // no-op
        }
      } as typeof ResizeObserver;

      try {
        const store = mockStore(createMockState());
        renderWithProvider(<PerpsOrderEntryPage />, store);

        fireEvent.click(screen.getByTestId('perps-order-book-toggle'));
        const divider = screen.getByTestId('perps-order-book-resize-handle');

        expect(divider).toHaveAttribute('aria-valuemax', '37');
        fireEvent.keyDown(divider, { key: 'Home' });
        expect(divider).toHaveAttribute('aria-valuenow', '37');
      } finally {
        window.ResizeObserver = OriginalResizeObserver;
        rectSpy.mockRestore();
      }
    });

    it('attaches the body ResizeObserver after markets finish loading (cold-load path)', () => {
      // Regression: useEffect([], []) ran while marketsLoading showed the
      // skeleton (bodyRef null) and never retried once the real body mounted.
      // Callback-ref setup must observe after loading completes.
      const rectSpy = jest
        .spyOn(Element.prototype, 'getBoundingClientRect')
        .mockReturnValue({
          right: 360,
          width: 360,
          left: 0,
          top: 0,
          bottom: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect);

      const OriginalResizeObserver = window.ResizeObserver;
      window.ResizeObserver = class {
        #callback: ResizeObserverCallback;

        constructor(callback: ResizeObserverCallback) {
          this.#callback = callback;
        }

        observe(target: Element) {
          this.#callback(
            [
              {
                target,
                contentRect: target.getBoundingClientRect(),
                borderBoxSize: [],
                contentBoxSize: [],
                devicePixelContentBoxSize: [],
              },
            ],
            this,
          );
        }

        unobserve() {
          // no-op
        }

        disconnect() {
          // no-op
        }
      } as typeof ResizeObserver;

      try {
        mockLiveMarketData.mockReturnValue({
          markets: [],
          isInitialLoading: true,
        });
        const store = mockStore(createMockState());
        const { rerender } = renderWithProvider(<PerpsOrderEntryPage />, store);

        expect(
          screen.queryByTestId('perps-order-book-toggle'),
        ).not.toBeInTheDocument();

        mockLiveMarketData.mockReturnValue({
          markets: [...mockCryptoMarkets, ...mockHip3Markets],
          isInitialLoading: false,
        });
        rerender(<PerpsOrderEntryPage />);

        fireEvent.click(screen.getByTestId('perps-order-book-toggle'));
        expect(
          screen.getByTestId('perps-order-book-resize-handle'),
        ).toHaveAttribute('aria-valuemax', '37');
      } finally {
        window.ResizeObserver = OriginalResizeObserver;
        rectSpy.mockRestore();
      }
    });

    it('clears the shared order book cache when the market symbol changes', () => {
      mockStreamManagerBase.orderBook.clearCache.mockClear();

      mockUseParams.mockReturnValue({ symbol: 'BTC' });
      const store = mockStore(createMockState());
      const { rerender } = renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(mockStreamManagerBase.orderBook.clearCache).toHaveBeenCalledTimes(
        1,
      );

      mockUseParams.mockReturnValue({ symbol: 'ETH' });
      rerender(<PerpsOrderEntryPage />);

      // Switching markets must drop the previous symbol's cached book so the
      // panel and top-of-book never replay a stale ladder before ETH streams in.
      expect(mockStreamManagerBase.orderBook.clearCache).toHaveBeenCalledTimes(
        2,
      );
    });

    it('tracks order_book_opened and order_book_closed interactions', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);
      mockAnalyticsTrackEvent.mockClear();

      fireEvent.click(screen.getByTestId('perps-order-book-toggle'));

      expect(mockAnalyticsTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: MetaMetricsEventName.PerpsUiInteraction,
          properties: expect.objectContaining({
            category: MetaMetricsEventCategory.Perps,
            [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
              PERPS_EVENT_VALUE.INTERACTION_TYPE.ORDER_BOOK_OPENED,
            [PERPS_EVENT_PROPERTY.ASSET]: 'ETH',
          }),
        }),
      );

      mockAnalyticsTrackEvent.mockClear();
      fireEvent.click(screen.getByTestId('perps-order-book-toggle'));

      expect(mockAnalyticsTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          name: MetaMetricsEventName.PerpsUiInteraction,
          properties: expect.objectContaining({
            category: MetaMetricsEventCategory.Perps,
            [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
              PERPS_EVENT_VALUE.INTERACTION_TYPE.ORDER_BOOK_CLOSED,
            [PERPS_EVENT_PROPERTY.ASSET]: 'ETH',
          }),
        }),
      );
    });

    it('switches to a limit order prefilled with the tapped ask price', () => {
      // Coverage for the market→limit type switch landing in the same commit as
      // the limit-price prefill (most existing form tests mount already on limit).
      const orderBook = {
        bids: [
          {
            price: '3499',
            size: '1',
            total: '1',
            notional: '3499',
            totalNotional: '3499',
          },
        ],
        asks: [
          {
            price: '3501',
            size: '1',
            total: '1',
            notional: '3501',
            totalNotional: '3501',
          },
        ],
        spread: '2',
        spreadPercentage: '0.057',
        midPrice: '3500',
        lastUpdated: 1,
        maxTotal: '1',
      };
      mockUsePerpsLiveOrderBook.mockReturnValue({
        orderBook,
        isInitialLoading: false,
        connectionStatus: 'connected',
        reconnect: jest.fn(),
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(screen.getByTestId('order-type-market')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.queryByTestId('limit-price-input')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('perps-order-book-toggle'));
      fireEvent.click(screen.getByTestId('perps-order-book-ask-row-0'));

      expect(screen.getByTestId('order-type-limit')).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      const limitInput = screen
        .getByTestId('limit-price-input')
        .querySelector('input');
      expect(limitInput).toHaveValue('3501');
    });
  });

  describe('redirects', () => {
    it('redirects to home when perps is disabled', () => {
      const store = mockStore(createMockState(false));
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(mockNavigateComponent).toHaveBeenCalledWith(
        expect.objectContaining({ to: '/', replace: true }),
      );
    });

    it('redirects to home when symbol is undefined', () => {
      mockUseParams.mockReturnValue({ symbol: undefined });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(mockNavigateComponent).toHaveBeenCalledWith(
        expect.objectContaining({ to: '/', replace: true }),
      );
    });

    it('shows skeleton when markets are loading', () => {
      mockLiveMarketData.mockReturnValue({
        markets: [],
        isInitialLoading: true,
      });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(
        screen.queryByTestId('parent-selector-perps-order-entry'),
      ).not.toBeInTheDocument();
    });

    it('keeps showing the skeleton when loading finishes with an empty catalog', () => {
      mockLiveMarketData.mockReturnValue({
        markets: [],
        isInitialLoading: false,
      });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(
        screen.queryByText(messages.perpsMarketNotFound.message),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('parent-selector-perps-order-entry'),
      ).not.toBeInTheDocument();
    });

    it('shows market not found when symbol does not match any market', () => {
      mockUseParams.mockReturnValue({ symbol: 'NONEXISTENT' });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(
        screen.getByText(messages.perpsMarketNotFound.message),
      ).toBeInTheDocument();
    });
  });

  describe('search params', () => {
    it('defaults to long direction', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);
      enterAmount('100');

      expect(screen.getByTestId('submit-order-button')).toHaveTextContent(
        'Open long',
      );
    });

    it('respects direction=short search param', () => {
      mockSearchParams.set('direction', 'short');
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);
      enterAmount('100');

      expect(screen.getByTestId('submit-order-button')).toHaveTextContent(
        'Open short',
      );
    });

    it('shows modify button text when mode=modify', () => {
      mockSearchParams.set('mode', 'modify');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(screen.getByTestId('submit-order-button')).toHaveTextContent(
        'Modify Position',
      );
    });

    it('shows close button text when mode=close', () => {
      mockSearchParams.set('mode', 'close');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(screen.getByTestId('submit-order-button')).toHaveTextContent(
        'Close position',
      );
    });

    it('shows limit price input when orderType=limit', () => {
      mockSearchParams.set('orderType', 'limit');
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(screen.getByTestId('limit-price-input')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('navigates back in history when back button is clicked', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      fireEvent.click(screen.getByTestId('perps-order-entry-back-button'));
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH', {
        replace: true,
      });
    });

    it('navigates back in history for encoded symbol markets', () => {
      mockUseParams.mockReturnValue({ symbol: 'xyz%3ATSLA' });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      fireEvent.click(screen.getByTestId('perps-order-entry-back-button'));
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/xyz%3ATSLA', {
        replace: true,
      });
    });
  });

  describe('submit button disabled states', () => {
    it('disables submit when limit order has no price', () => {
      mockSearchParams.set('orderType', 'limit');
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(screen.getByTestId('submit-order-button')).toBeDisabled();
    });

    it('disables submit button and shows add funds label when balance is zero', () => {
      mockLiveAccount.mockReturnValue({
        account: {
          ...mockAccountState,
          spendableBalance: '0',
          withdrawableBalance: '0',
          totalBalance: '0',
        },
        isInitialLoading: false,
      });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const submitButton = screen.getByTestId('submit-order-button');

      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(messages.addFunds.message);
    });

    it('disables submit button when user is not eligible and balance is zero', () => {
      mockUsePerpsEligibility.mockReturnValue({ isEligible: false });
      mockLiveAccount.mockReturnValue({
        account: {
          ...mockAccountState,
          spendableBalance: '0',
          withdrawableBalance: '0',
          totalBalance: '0',
        },
        isInitialLoading: false,
      });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const submitButton = screen.getByTestId('submit-order-button');
      expect(submitButton).toBeDisabled();
    });

    it('gates the amount input add funds action when compliance blocks the selected wallet', async () => {
      // Simulate a blocked wallet: the gate short-circuits and never runs the
      // wrapped add-funds action. Real compliance check + access-restricted modal
      // are covered in useComplianceGate.test.tsx and
      // access-restricted-context.test.tsx.
      mockComplianceGate.mockImplementationOnce(async () => undefined);
      const store = mockStore(createMockState());

      renderWithProvider(<PerpsOrderEntryPage />, store);

      await act(async () => {
        fireEvent.click(screen.getByTestId('amount-input-add-funds'));
      });

      await waitFor(() => expect(mockComplianceGate).toHaveBeenCalled());
      expect(mockTriggerDeposit).not.toHaveBeenCalled();
    });

    it('shows geo-block modal instead of placing order when user is not eligible and has balance', async () => {
      mockUsePerpsEligibility.mockReturnValue({ isEligible: false });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const input = amountContainer.querySelector('input');
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '100' },
      });

      const submitButton = screen.getByTestId('submit-order-button');
      expect(submitButton).not.toBeDisabled();

      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsPlaceOrder',
        expect.anything(),
      );
      expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
    });

    it('disables submit while account state is still loading for a new order', () => {
      mockLiveAccount.mockReturnValue({
        account: {
          ...mockAccountState,
          spendableBalance: '0',
          withdrawableBalance: '0',
          totalBalance: '0',
        },
        isInitialLoading: true,
      });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(screen.getByTestId('submit-order-button')).toBeDisabled();
    });

    it('disables submit when selected account address is missing', async () => {
      const state = createMockState();
      state.metamask.internalAccounts = {
        ...state.metamask.internalAccounts,
        selectedAccount: 'missing-account-id',
      };
      const store = mockStore(state);
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const submitButton = screen.getByTestId('submit-order-button');
      expect(submitButton).toBeDisabled();

      await act(async () => {
        fireEvent.click(submitButton);
      });

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsPlaceOrder',
        expect.anything(),
      );
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsClosePosition',
        expect.anything(),
      );
    });

    it('disables submit when long limit price is above current price', () => {
      mockSearchParams.set('orderType', 'limit');
      mockSearchParams.set('direction', 'long');
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const limitContainer = screen.getByTestId('limit-price-input');
      const limitInput = limitContainer.querySelector('input');
      fireEvent.change(limitInput as HTMLInputElement, {
        target: { value: '99999' },
      });

      expect(screen.getByTestId('submit-order-button')).toBeDisabled();
    });

    it('disables submit when short limit price is below current price', () => {
      mockSearchParams.set('orderType', 'limit');
      mockSearchParams.set('direction', 'short');
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const limitContainer = screen.getByTestId('limit-price-input');
      const limitInput = limitContainer.querySelector('input');
      fireEvent.change(limitInput as HTMLInputElement, {
        target: { value: '1' },
      });

      expect(screen.getByTestId('submit-order-button')).toBeDisabled();
    });

    it('does not disable submit for favorable long limit price', () => {
      mockSearchParams.set('orderType', 'limit');
      mockSearchParams.set('direction', 'long');
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const amountInput = amountContainer.querySelector('input');
      fireEvent.change(amountInput as HTMLInputElement, {
        target: { value: '100' },
      });

      const limitContainer = screen.getByTestId('limit-price-input');
      const limitInput = limitContainer.querySelector('input');
      fireEvent.change(limitInput as HTMLInputElement, {
        target: { value: '1000' },
      });

      expect(screen.getByTestId('submit-order-button')).not.toBeDisabled();
    });

    it('does not disable submit for favorable short limit price', () => {
      mockSearchParams.set('orderType', 'limit');
      mockSearchParams.set('direction', 'short');
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const amountInput = amountContainer.querySelector('input');
      fireEvent.change(amountInput as HTMLInputElement, {
        target: { value: '100' },
      });

      const limitContainer = screen.getByTestId('limit-price-input');
      const limitInput = limitContainer.querySelector('input');
      fireEvent.change(limitInput as HTMLInputElement, {
        target: { value: '99999' },
      });

      expect(screen.getByTestId('submit-order-button')).not.toBeDisabled();
    });

    it('disables submit when limit order would be near liquidation', async () => {
      mockIsNearLiquidationPrice.mockReturnValue(true);

      mockSearchParams.set('orderType', 'limit');
      mockSearchParams.set('direction', 'long');
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const amountInput = amountContainer.querySelector('input');
      fireEvent.change(amountInput as HTMLInputElement, {
        target: { value: '1000' },
      });

      // Favorable limit price (below currentPrice ~$3,025.50) so the
      // button is NOT disabled by the unfavorable-price guard.
      const limitContainer = screen.getByTestId('limit-price-input');
      const limitInput = limitContainer.querySelector('input');
      fireEvent.change(limitInput as HTMLInputElement, {
        target: { value: '3000' },
      });

      await waitFor(() => {
        expect(screen.getByTestId('submit-order-button')).toBeDisabled();
      });
      expect(
        screen.queryByTestId('limit-price-warning'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId('limit-price-liquidation-warning'),
      ).toBeInTheDocument();
    });

    it('disables submit and shows Insufficient funds when order exceeds available balance', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const amountInput = amountContainer.querySelector('input');
      // spendableBalance is 10125, default leverage is 3, so max amount = 30375
      // Enter 50000 which requires margin of 50000/3 ≈ 16666 > 10125
      fireEvent.change(amountInput as HTMLInputElement, {
        target: { value: '50000' },
      });

      expect(screen.getByTestId('submit-order-button')).toBeDisabled();
      expect(screen.getByTestId('submit-order-button')).toHaveTextContent(
        messages.insufficientFundsSend.message,
      );
    });

    it('does not disable submit when order is within available balance', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const amountInput = amountContainer.querySelector('input');
      // Enter 100 which requires margin of 100/3 ≈ 33 < 10125
      fireEvent.change(amountInput as HTMLInputElement, {
        target: { value: '100' },
      });

      expect(screen.getByTestId('submit-order-button')).not.toBeDisabled();
      expect(screen.getByTestId('submit-order-button')).not.toHaveTextContent(
        messages.insufficientFundsSend.message,
      );
    });

    it('disables submit while max slippage preference is loading', async () => {
      mockUsePerpsEstimatedSlippage.mockReturnValue({
        estimatedSlippageBps: 50,
        isReady: true,
      });
      mockUsePerpsMaxSlippage.mockReturnValue({
        maxSlippageBps: 300,
        maxSlippageSource: 'default',
        setMaxSlippage: jest.fn(),
        isLoading: true,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      enterAmount('100');

      await waitFor(() => {
        expect(screen.getByTestId('submit-order-button')).toBeDisabled();
      });
      expect(
        screen.queryByTestId('perps-order-slippage-exceeds-indicator'),
      ).not.toBeInTheDocument();
    });

    it('does not open slippage config modal while max slippage preference is loading', async () => {
      const setMaxSlippage = jest.fn().mockResolvedValue(undefined);
      mockUsePerpsEstimatedSlippage.mockReturnValue({
        estimatedSlippageBps: 50,
        isReady: true,
      });
      mockUsePerpsMaxSlippage.mockReturnValue({
        maxSlippageBps: 300,
        maxSlippageSource: 'default',
        setMaxSlippage,
        isLoading: true,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      enterAmount('100');

      await waitFor(() => {
        expect(
          screen.getByTestId('perps-order-summary-slippage-row'),
        ).toBeDisabled();
      });

      fireEvent.click(screen.getByTestId('perps-order-summary-slippage-row'));

      expect(
        screen.queryByTestId('perps-slippage-config-modal'),
      ).not.toBeInTheDocument();
      expect(setMaxSlippage).not.toHaveBeenCalled();
    });

    it('disables submit while slippage estimate is still loading', async () => {
      mockUsePerpsEstimatedSlippage.mockReturnValue({
        estimatedSlippageBps: null,
        isReady: false,
      });
      mockUsePerpsMaxSlippage.mockReturnValue({
        maxSlippageBps: 300,
        maxSlippageSource: 'default',
        setMaxSlippage: jest.fn(),
        isLoading: false,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      enterAmount('100');

      await waitFor(() => {
        expect(screen.getByTestId('submit-order-button')).toBeDisabled();
      });
    });

    it('shows resolved max slippage while estimate is still loading', async () => {
      mockUsePerpsEstimatedSlippage.mockReturnValue({
        estimatedSlippageBps: null,
        isReady: false,
      });
      mockUsePerpsMaxSlippage.mockReturnValue({
        maxSlippageBps: 300,
        maxSlippageSource: 'default',
        setMaxSlippage: jest.fn(),
        isLoading: false,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      enterAmount('100');

      await waitFor(() => {
        expect(
          screen.getByTestId('perps-order-summary-slippage-value'),
        ).toHaveTextContent(
          tEn('perpsSlippageRowFormatPending', [`${bpsToPercent(300)}`]),
        );
      });
    });

    it('blocks submit and shows slippage error when estimated slippage exceeds max', async () => {
      const estimatedSlippageBps = 50;
      const maxSlippageBps = 10;
      mockUsePerpsEstimatedSlippage.mockReturnValue({
        estimatedSlippageBps,
        isReady: true,
      });
      mockUsePerpsMaxSlippage.mockReturnValue({
        maxSlippageBps,
        maxSlippageSource: 'user_configured',
        setMaxSlippage: jest.fn(),
        isLoading: false,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      enterAmount('100');

      await waitFor(() => {
        expect(
          screen.getByTestId('perps-order-slippage-exceeds-indicator'),
        ).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsPlaceOrder',
        expect.anything(),
      );
      expect(screen.getByTestId('perps-order-submit-error')).toHaveTextContent(
        tEn('perpsSlippageExceedsMax', [
          bpsToPercent(estimatedSlippageBps).toFixed(2),
          bpsToPercent(maxSlippageBps).toFixed(2),
        ]),
      );
    });

    it('clears slippage submit error after max slippage is saved from config modal', async () => {
      const estimatedSlippageBps = 50;
      const maxSlippageBps = 10;
      const setMaxSlippage = jest.fn().mockResolvedValue(undefined);
      mockUsePerpsEstimatedSlippage.mockReturnValue({
        estimatedSlippageBps,
        isReady: true,
      });
      mockUsePerpsMaxSlippage.mockReturnValue({
        maxSlippageBps,
        maxSlippageSource: 'user_configured',
        setMaxSlippage,
        isLoading: false,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      enterAmount('100');

      await waitFor(() => {
        expect(
          screen.getByTestId('perps-order-slippage-exceeds-indicator'),
        ).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(
        screen.getByTestId('perps-order-submit-error'),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('perps-order-summary-slippage-row'));

      await waitFor(() => {
        expect(
          screen.getByTestId('perps-slippage-config-set'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('perps-slippage-config-preset-3'));
      await act(async () => {
        fireEvent.click(screen.getByTestId('perps-slippage-config-set'));
      });

      expect(setMaxSlippage).toHaveBeenCalledWith(300);
      expect(
        screen.queryByTestId('perps-order-submit-error'),
      ).not.toBeInTheDocument();
    });

    it('disables submit when auto-close take profit is invalid', async () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const amountInput = amountContainer.querySelector('input');
      fireEvent.change(amountInput as HTMLInputElement, {
        target: { value: '100' },
      });

      fireEvent.click(screen.getByTestId('auto-close-toggle'));

      const tpContainer = screen.getByTestId('tp-price-input');
      const tpInput = tpContainer.querySelector('input');
      fireEvent.change(tpInput as HTMLInputElement, {
        target: { value: '1000' },
      });

      await waitFor(() => {
        expect(screen.getByTestId('submit-order-button')).toBeDisabled();
      });
    });

    it('disables submit when long auto-close stop loss is below liquidation price', async () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const amountInput = amountContainer.querySelector('input');
      fireEvent.change(amountInput as HTMLInputElement, {
        target: { value: '100' },
      });

      fireEvent.click(screen.getByTestId('auto-close-toggle'));

      const slContainer = screen.getByTestId('sl-price-input');
      const slInput = slContainer.querySelector('input');
      fireEvent.change(slInput as HTMLInputElement, {
        target: { value: '1' },
      });

      await waitFor(() => {
        expect(screen.getByTestId('submit-order-button')).toBeDisabled();
      });
      expect(screen.getByTestId('sl-validation-error')).toHaveTextContent(
        /above.*liquidation/iu,
      );
    });

    it('disables submit when short auto-close stop loss is above liquidation price', async () => {
      mockSearchParams.set('direction', 'short');
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const amountInput = amountContainer.querySelector('input');
      fireEvent.change(amountInput as HTMLInputElement, {
        target: { value: '100' },
      });

      fireEvent.click(screen.getByTestId('auto-close-toggle'));

      const slContainer = screen.getByTestId('sl-price-input');
      const slInput = slContainer.querySelector('input');
      fireEvent.change(slInput as HTMLInputElement, {
        target: { value: '99999' },
      });

      await waitFor(() => {
        expect(screen.getByTestId('submit-order-button')).toBeDisabled();
      });
      expect(screen.getByTestId('sl-validation-error')).toHaveTextContent(
        /below.*liquidation/iu,
      );
    });
  });

  describe('analytics tracking', () => {
    const renderWithTracking = () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const screenViewedCalls = mockAnalyticsTrackEvent.mock.calls.filter(
        ([arg]) => arg?.name === MetaMetricsEventName.PerpsScreenViewed,
      );

      expect(screenViewedCalls).toHaveLength(1);
      expect(screenViewedCalls[0][0]).toEqual(
        expect.objectContaining({
          name: MetaMetricsEventName.PerpsScreenViewed,
          properties: expect.objectContaining({
            category: MetaMetricsEventCategory.Perps,
            [PERPS_EVENT_PROPERTY.SCREEN_TYPE]:
              PERPS_EVENT_VALUE.SCREEN_TYPE.TRADING,
            [PERPS_EVENT_PROPERTY.SOURCE]:
              PERPS_EVENT_VALUE.SOURCE.ASSET_DETAILS,
          }),
        }),
      );

      return screenViewedCalls[0][0].properties[
        PERPS_EVENT_PROPERTY.HAS_PERP_BALANCE
      ];
    };

    it('includes saved-order defaults on the trading screen view', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const screenViewedCall = mockAnalyticsTrackEvent.mock.calls.find(
        ([arg]) => arg?.name === MetaMetricsEventName.PerpsScreenViewed,
      );

      expect(screenViewedCall?.[0].properties).toEqual(
        expect.objectContaining({
          [PERPS_EVENT_PROPERTY.SAVED_ORDER]: false,
          [PERPS_EVENT_PROPERTY.DEFAULT_LEVERAGE]: expect.any(Number),
          [PERPS_EVENT_PROPERTY.DEFAULT_AUTO_CLOSE]: false,
        }),
      );
    });

    const consideredCalls = () =>
      mockAnalyticsTrackEvent.mock.calls.filter(
        ([arg]) =>
          arg?.name === MetaMetricsEventName.PerpsTransactionConsidered,
      );

    it('emits PERPS_TRANSACTION_CONSIDERED after a debounced user fill', async () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      enterAmount('100');

      await waitFor(() => expect(consideredCalls()).toHaveLength(1), {
        timeout: 2000,
      });

      expect(consideredCalls()[0][0].properties).toEqual(
        expect.objectContaining({
          [PERPS_EVENT_PROPERTY.ORDER_CONTEXT]: 'trade',
          [PERPS_EVENT_PROPERTY.ACTION]:
            PERPS_EVENT_VALUE.ACTION.CREATE_POSITION,
          [PERPS_EVENT_PROPERTY.ORDER_SIZE]: 100,
          [PERPS_EVENT_PROPERTY.ORDER_TYPE]: 'market',
          [PERPS_EVENT_PROPERTY.INPUT_METHOD]: 'keypad',
          [PERPS_EVENT_PROPERTY.TRADE_WITH_TOKEN]: false,
          [PERPS_EVENT_PROPERTY.LEVERAGE]: expect.any(Number),
        }),
      );
    });

    it('does not emit CONSIDERED on the seeded/default fill', async () => {
      jest.useFakeTimers();
      try {
        await act(async () => {
          renderWithProvider(
            <PerpsOrderEntryPage />,
            mockStore(createMockState()),
          );
        });
        // No user interaction — only the default amount was populated.
        await act(async () => {
          jest.advanceTimersByTime(1500);
        });
        expect(consideredCalls()).toHaveLength(0);
      } finally {
        await act(async () => {
          jest.runOnlyPendingTimers();
        });
        jest.useRealTimers();
      }
    });

    it('resets the debounce when the fill changes before 1s', async () => {
      jest.useFakeTimers();
      try {
        await act(async () => {
          renderWithProvider(
            <PerpsOrderEntryPage />,
            mockStore(createMockState()),
          );
        });
        await act(async () => enterAmount('100'));
        await act(async () => {
          jest.advanceTimersByTime(500);
        });
        await act(async () => enterAmount('200'));
        await act(async () => {
          jest.advanceTimersByTime(500);
        });
        expect(consideredCalls()).toHaveLength(0);
        await act(async () => {
          jest.advanceTimersByTime(600);
        });
        expect(consideredCalls()).toHaveLength(1);
        expect(consideredCalls()[0][0].properties).toEqual(
          expect.objectContaining({ [PERPS_EVENT_PROPERTY.ORDER_SIZE]: 200 }),
        );
      } finally {
        await act(async () => {
          jest.runOnlyPendingTimers();
        });
        jest.useRealTimers();
      }
    });

    it('does not emit CONSIDERED in close mode', async () => {
      jest.useFakeTimers();
      mockSearchParams.set('mode', 'close');
      try {
        await act(async () => {
          renderWithProvider(
            <PerpsOrderEntryPage />,
            mockStore(createMockState()),
          );
        });
        await act(async () => {
          jest.advanceTimersByTime(1500);
        });
        expect(consideredCalls()).toHaveLength(0);
      } finally {
        await act(async () => {
          jest.runOnlyPendingTimers();
        });
        jest.useRealTimers();
      }
    });

    it('clamps default_leverage to the market max on the trading screen view', () => {
      const ethMarket = mockCryptoMarkets.find((m) => m.symbol === 'ETH');
      if (!ethMarket) {
        throw new Error('ETH market fixture missing');
      }
      mockLiveMarketData.mockReturnValue({
        markets: [{ ...ethMarket, maxLeverage: '25x' }],
        isInitialLoading: false,
      });
      const state = createMockState();
      // Saved leverage well above the market max — the UI seeds the clamped
      // value, so the analytics default must be clamped too.
      (state.metamask as Record<string, unknown>).tradeConfigurations = {
        mainnet: { ETH: { leverage: 999 } },
        testnet: { ETH: { leverage: 999 } },
      };
      renderWithProvider(<PerpsOrderEntryPage />, mockStore(state));

      const screenViewed = mockAnalyticsTrackEvent.mock.calls.find(
        ([arg]) => arg?.name === MetaMetricsEventName.PerpsScreenViewed,
      );
      expect(
        screenViewed?.[0].properties[PERPS_EVENT_PROPERTY.DEFAULT_LEVERAGE],
      ).toBe(25);
    });

    it('reschedules the considered debounce on a non-size change', async () => {
      jest.useFakeTimers();
      try {
        await act(async () => {
          renderWithProvider(
            <PerpsOrderEntryPage />,
            mockStore(createMockState()),
          );
        });
        await act(async () => enterAmount('100'));
        await act(async () => {
          jest.advanceTimersByTime(900);
        });
        // A non-size change (toggle auto-close) must reschedule the pending
        // event, not cancel it.
        await act(async () => {
          fireEvent.click(screen.getByTestId('auto-close-toggle'));
        });
        await act(async () => {
          jest.advanceTimersByTime(600);
        });
        expect(consideredCalls()).toHaveLength(0);
        await act(async () => {
          jest.advanceTimersByTime(500);
        });
        expect(consideredCalls()).toHaveLength(1);
      } finally {
        await act(async () => {
          jest.runOnlyPendingTimers();
        });
        jest.useRealTimers();
      }
    });

    it('resets considered gating on symbol change so the next market default does not fire', async () => {
      jest.useFakeTimers();
      try {
        let view!: ReturnType<typeof renderWithProvider>;
        await act(async () => {
          view = renderWithProvider(
            <PerpsOrderEntryPage />,
            mockStore(createMockState()),
          );
        });
        await act(async () => enterAmount('100'));
        await act(async () => {
          jest.advanceTimersByTime(1500);
        });
        expect(consideredCalls()).toHaveLength(1);

        // Navigate to a different market; the prior edit must not carry over.
        mockUseParams.mockReturnValue({ symbol: 'BTC' });
        await act(async () => {
          view.rerender(<PerpsOrderEntryPage />);
        });
        await act(async () => {
          jest.advanceTimersByTime(1500);
        });
        expect(consideredCalls()).toHaveLength(1);
      } finally {
        await act(async () => {
          jest.runOnlyPendingTimers();
        });
        jest.useRealTimers();
      }
    });

    it('resets considered gating on direction switch so the reseeded amount does not fire', async () => {
      jest.useFakeTimers();
      try {
        await act(async () => {
          renderWithProvider(
            <PerpsOrderEntryPage />,
            mockStore(createMockState()),
          );
        });

        // User edits the size, then switches Long/Short before the debounce
        // elapses. Switching reseeds usePerpsOrderForm to its default amount;
        // the seeded default must NOT emit CONSIDERED without a fresh edit.
        await act(async () => enterAmount('100'));
        await act(async () => {
          fireEvent.click(screen.getByTestId('direction-tab-short'));
        });
        await act(async () => {
          jest.advanceTimersByTime(1500);
        });
        expect(consideredCalls()).toHaveLength(0);

        // A new size interaction after the switch re-arms the event.
        await act(async () => enterAmount('250'));
        await act(async () => {
          jest.advanceTimersByTime(1500);
        });
        expect(consideredCalls()).toHaveLength(1);
        expect(consideredCalls()[0][0].properties).toEqual(
          expect.objectContaining({ [PERPS_EVENT_PROPERTY.ORDER_SIZE]: 250 }),
        );
      } finally {
        await act(async () => {
          jest.runOnlyPendingTimers();
        });
        jest.useRealTimers();
      }
    });

    it('emits the error screen view when the order submit fails', async () => {
      mockSearchParams.set('orderType', 'limit');
      mockSearchParams.set('direction', 'long');
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsPlaceOrder') {
          return Promise.resolve({ success: false, error: 'Order failed' });
        }
        return Promise.resolve(undefined);
      });
      renderWithProvider(<PerpsOrderEntryPage />, mockStore(createMockState()));

      const amountContainer = screen.getByTestId('amount-input-field');
      fireEvent.change(
        amountContainer.querySelector('input') as HTMLInputElement,
        { target: { value: '100' } },
      );
      const limitContainer = screen.getByTestId('limit-price-input');
      fireEvent.change(
        limitContainer.querySelector('input') as HTMLInputElement,
        { target: { value: '1000' } },
      );

      const submitButton = screen.getByTestId('submit-order-button');
      await waitFor(() => expect(submitButton).not.toBeDisabled());
      await act(async () => {
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        const errorScreens = mockAnalyticsTrackEvent.mock.calls.filter(
          ([arg]) =>
            arg?.name === MetaMetricsEventName.PerpsScreenViewed &&
            arg?.properties?.[PERPS_EVENT_PROPERTY.SCREEN_TYPE] ===
              PERPS_EVENT_VALUE.SCREEN_TYPE.ERROR,
        );
        expect(errorScreens.length).toBeGreaterThanOrEqual(1);
        expect(
          errorScreens[0][0].properties[PERPS_EVENT_PROPERTY.SCREEN_NAME],
        ).toBe('perps_order');
      });
    });

    it('does not reset the considered debounce on live position stream churn', async () => {
      jest.useFakeTimers();
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      try {
        let view!: ReturnType<typeof renderWithProvider>;
        await act(async () => {
          view = renderWithProvider(
            <PerpsOrderEntryPage />,
            mockStore(createMockState()),
          );
        });
        await act(async () => enterAmount('100'));
        await act(async () => {
          jest.advanceTimersByTime(900);
        });
        // Position stream churns (new object refs, same ETH position) mid-
        // debounce. With the old live-`position` dep this reset the timer and
        // could drop the event; gating on the stable `positionDirection`
        // primitive must leave the pending debounce intact.
        mockLivePositions.mockReturnValue({
          positions: mockPositions.map((p) => ({ ...p })),
          isInitialLoading: false,
        });
        await act(async () => {
          view.rerender(<PerpsOrderEntryPage />);
        });
        await act(async () => {
          jest.advanceTimersByTime(200);
        });
        expect(consideredCalls()).toHaveLength(1);
        expect(consideredCalls()[0][0].properties).toEqual(
          expect.objectContaining({
            [PERPS_EVENT_PROPERTY.ACTION]:
              PERPS_EVENT_VALUE.ACTION.INCREASE_EXPOSURE,
          }),
        );
      } finally {
        await act(async () => {
          jest.runOnlyPendingTimers();
        });
        jest.useRealTimers();
      }
    });

    it('carries the slippage configuration on the considered event', async () => {
      renderWithProvider(<PerpsOrderEntryPage />, mockStore(createMockState()));

      enterAmount('100');

      await waitFor(() => expect(consideredCalls()).toHaveLength(1), {
        timeout: 2000,
      });
      // These three moved here when the client trade event was removed: the
      // controller's TrackingData has no slippage fields. Coverage is partial by
      // construction — see the note in report.md. Exact values, not shapes: the
      // mocks fix maxSlippageBps at 300 and estimatedSlippageBps at 50, so a
      // regression in the bps->pct conversion or the source mapping fails here.
      expect(consideredCalls()[0][0].properties).toEqual(
        expect.objectContaining({
          [PERPS_EVENT_PROPERTY.MAX_SLIPPAGE_PCT]: 3,
          [PERPS_EVENT_PROPERTY.MAX_SLIPPAGE_SOURCE]:
            PERPS_EVENT_VALUE.MAX_SLIPPAGE_SOURCE.DEFAULT,
          [PERPS_EVENT_PROPERTY.ESTIMATED_SLIPPAGE_PCT]: 0.5,
        }),
      );
    });

    it('omits the action when an opposite-side order only reduces the position', async () => {
      // $100 against 2.5 ETH is ~0.03 ETH — a reduction. Comparing the USD
      // amount to the asset-unit position used to call this a flip, and to
      // disagree with the executed event, which sizes in asset units.
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      mockSearchParams.set('direction', 'short');
      renderWithProvider(<PerpsOrderEntryPage />, mockStore(createMockState()));

      enterAmount('100');

      await waitFor(() => expect(consideredCalls()).toHaveLength(1), {
        timeout: 2000,
      });
      expect(consideredCalls()[0][0].properties).not.toHaveProperty(
        PERPS_EVENT_PROPERTY.ACTION,
      );
    });

    it('emits CONSIDERED with flip_long_to_short for a short order on a long position', async () => {
      // ETH position is long (size 2.5) at ~3025; at 3x leverage $5000 buys
      // ~4.96 ETH, which overshoots it — a real flip.
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      mockSearchParams.set('direction', 'short');
      renderWithProvider(<PerpsOrderEntryPage />, mockStore(createMockState()));

      enterAmount('5000');

      await waitFor(() => expect(consideredCalls()).toHaveLength(1), {
        timeout: 2000,
      });
      expect(consideredCalls()[0][0].properties).toEqual(
        expect.objectContaining({
          [PERPS_EVENT_PROPERTY.ACTION]:
            PERPS_EVENT_VALUE.ACTION.FLIP_LONG_TO_SHORT,
        }),
      );
    });

    it('emits CONSIDERED with flip_short_to_long for a long order on a short position', async () => {
      // BTC position is short (size -0.5); the order must overshoot it in
      // ASSET units to be a flip.
      mockUseParams.mockReturnValue({ symbol: 'BTC' });
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      mockSearchParams.set('direction', 'long');
      renderWithProvider(<PerpsOrderEntryPage />, mockStore(createMockState()));

      enterAmount('25000');

      await waitFor(() => expect(consideredCalls()).toHaveLength(1), {
        timeout: 2000,
      });
      expect(consideredCalls()[0][0].properties).toEqual(
        expect.objectContaining({
          [PERPS_EVENT_PROPERTY.ACTION]:
            PERPS_EVENT_VALUE.ACTION.FLIP_SHORT_TO_LONG,
        }),
      );
    });

    it('emits the error screen view when the market is not found', () => {
      mockLiveMarketData.mockReturnValue({
        markets: [...mockCryptoMarkets, ...mockHip3Markets],
        isInitialLoading: false,
      });
      mockUseParams.mockReturnValue({ symbol: 'DOESNOTEXIST' });
      renderWithProvider(<PerpsOrderEntryPage />, mockStore(createMockState()));

      const errorCall = mockAnalyticsTrackEvent.mock.calls.find(
        ([arg]) =>
          arg?.name === MetaMetricsEventName.PerpsScreenViewed &&
          arg?.properties?.screen_type === 'error',
      );
      expect(errorCall).toBeDefined();
      expect(errorCall?.[0].properties).toEqual(
        expect.objectContaining({
          [PERPS_EVENT_PROPERTY.ERROR_TYPE]: 'market_not_found',
          [PERPS_EVENT_PROPERTY.SCREEN_NAME]: 'perps_order',
        }),
      );
    });

    it('does not emit an error screen view while the market catalog is empty', () => {
      mockLiveMarketData.mockReturnValue({
        markets: [],
        isInitialLoading: false,
      });
      renderWithProvider(<PerpsOrderEntryPage />, mockStore(createMockState()));

      expect(
        mockAnalyticsTrackEvent.mock.calls.some(
          ([arg]) =>
            arg?.name === MetaMetricsEventName.PerpsScreenViewed &&
            arg?.properties?.screen_type === 'error',
        ),
      ).toBe(false);
    });

    it('does not report abandonment when leaving a market-not-found screen', async () => {
      // No order form was ever shown, so there is nothing to abandon.
      mockLiveMarketData.mockReturnValue({
        markets: [...mockCryptoMarkets, ...mockHip3Markets],
        isInitialLoading: false,
      });
      mockUseParams.mockReturnValue({ symbol: 'DOESNOTEXIST' });

      const { unmount } = renderWithProvider(
        <PerpsOrderEntryPage />,
        mockStore(createMockState()),
      );
      unmount();
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(
        mockAnalyticsTrackEvent.mock.calls.some(
          ([arg]) => arg?.properties?.action === 'abandon_order',
        ),
      ).toBe(false);
    });

    it('does not report abandonment when leaving while the markets are still loading', async () => {
      mockLiveMarketData.mockReturnValue({
        markets: [],
        isInitialLoading: true,
      });

      const { unmount } = renderWithProvider(
        <PerpsOrderEntryPage />,
        mockStore(createMockState()),
      );
      unmount();
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(
        mockAnalyticsTrackEvent.mock.calls.some(
          ([arg]) => arg?.properties?.action === 'abandon_order',
        ),
      ).toBe(false);
    });

    it('emits abandon_order with the form snapshot when the page is left uncommitted', async () => {
      const { unmount } = renderWithProvider(
        <PerpsOrderEntryPage />,
        mockStore(createMockState()),
      );

      enterAmount('100');
      unmount();
      // The abandon emit is deferred one macrotask so a StrictMode probe can
      // cancel it.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const abandonCall = mockAnalyticsTrackEvent.mock.calls.find(
        ([arg]) =>
          arg?.name === MetaMetricsEventName.PerpsUiInteraction &&
          arg?.properties?.action === 'abandon_order' &&
          arg?.properties?.asset === 'ETH',
      );
      expect(abandonCall).toBeDefined();
      expect(abandonCall?.[0].properties).toEqual(
        expect.objectContaining({
          [PERPS_EVENT_PROPERTY.ASSET]: 'ETH',
          [PERPS_EVENT_PROPERTY.ORDER_SIZE]: 100,
        }),
      );
      expect(
        abandonCall?.[0].properties[PERPS_EVENT_PROPERTY.TIME_ON_SCREEN_MS],
      ).toBeGreaterThanOrEqual(0);
    });

    it('still reports abandonment after a failed submit leaves the user on the form', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsPlaceOrder') {
          return Promise.resolve({ success: false, error: 'Order failed' });
        }
        return Promise.resolve(undefined);
      });
      const { unmount } = renderWithProvider(
        <PerpsOrderEntryPage />,
        mockStore(createMockState()),
      );

      enterAmount('100');
      const submitButton = screen.getByTestId('submit-order-button');
      await waitFor(() => expect(submitButton).not.toBeDisabled());
      await act(async () => {
        fireEvent.click(submitButton);
      });
      // Precondition: the submit really ran and failed, so the commit flag was
      // set and then re-armed. Without this the assertion below would pass even
      // if the click never reached the controller.
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsPlaceOrder',
        expect.anything(),
      );
      // The failure re-arms the commit flag, so leaving now is a real
      // abandonment rather than the tail of a committed order.
      unmount();
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const abandonCall = mockAnalyticsTrackEvent.mock.calls.find(
        ([arg]) =>
          arg?.name === MetaMetricsEventName.PerpsUiInteraction &&
          arg?.properties?.action === 'abandon_order',
      );
      expect(abandonCall?.[0].properties).toEqual(
        expect.objectContaining({
          [PERPS_EVENT_PROPERTY.ASSET]: 'ETH',
          [PERPS_EVENT_PROPERTY.ORDER_SIZE]: 100,
        }),
      );
    });

    it('emits exactly one error screen view and no trading view when the market is not found', () => {
      mockLiveMarketData.mockReturnValue({
        markets: [...mockCryptoMarkets, ...mockHip3Markets],
        isInitialLoading: false,
      });
      mockUseParams.mockReturnValue({ symbol: 'DOESNOTEXIST' });
      renderWithProvider(<PerpsOrderEntryPage />, mockStore(createMockState()));

      const screenViews = mockAnalyticsTrackEvent.mock.calls.filter(
        ([arg]) => arg?.name === MetaMetricsEventName.PerpsScreenViewed,
      );

      // One rendered error screen => one screen-view event: the trading view is
      // gated on the market existing so it must not also fire.
      expect(
        screenViews.filter(([arg]) => arg?.properties?.screen_type === 'error'),
      ).toHaveLength(1);
      expect(
        screenViews.filter(
          ([arg]) => arg?.properties?.screen_type === 'trading',
        ),
      ).toHaveLength(0);
    });

    it('re-arms the error screen view for a second unknown symbol', () => {
      mockLiveMarketData.mockReturnValue({
        markets: [...mockCryptoMarkets, ...mockHip3Markets],
        isInitialLoading: false,
      });
      mockUseParams.mockReturnValue({ symbol: 'BADONE' });
      const { rerender } = renderWithProvider(
        <PerpsOrderEntryPage />,
        mockStore(createMockState()),
      );

      mockUseParams.mockReturnValue({ symbol: 'BADTWO' });
      rerender(<PerpsOrderEntryPage />);

      const errorCalls = mockAnalyticsTrackEvent.mock.calls.filter(
        ([arg]) =>
          arg?.name === MetaMetricsEventName.PerpsScreenViewed &&
          arg?.properties?.screen_type === 'error',
      );

      // resetKey keyed on the symbol lets consecutive invalid symbols each track.
      expect(errorCalls).toHaveLength(2);
    });

    it('tracks has_perp_balance as true when unified funds are tradeable but not withdrawable', () => {
      mockLiveAccount.mockReturnValue({
        account: {
          ...mockAccountState,
          spendableBalance: '0',
          withdrawableBalance: '100',
        },
        isInitialLoading: false,
      });

      const hasPerpBalance = renderWithTracking();

      expect(hasPerpBalance).toBe(true);
    });

    it('uses withdrawableBalance when both balances are set', () => {
      mockLiveAccount.mockReturnValue({
        account: {
          ...mockAccountState,
          spendableBalance: '100',
          withdrawableBalance: '100',
        },
        isInitialLoading: false,
      });

      const hasPerpBalance = renderWithTracking();

      expect(hasPerpBalance).toBe(true);
    });

    it('tracks has_perp_balance as false when both withdrawable and tradeable balances are zero', () => {
      mockLiveAccount.mockReturnValue({
        account: {
          ...mockAccountState,
          spendableBalance: '0',
          withdrawableBalance: '0',
          totalBalance: '0',
        },
        isInitialLoading: false,
      });

      const hasPerpBalance = renderWithTracking();

      expect(hasPerpBalance).toBe(false);
    });
  });

  describe('order submission', () => {
    beforeEach(() => {
      mockSubmitRequestToBackground.mockResolvedValue({ success: true });
    });

    it('calls placeOrder on submit for new market order', async () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const input = amountContainer.querySelector('input');
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '1000' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsPlaceOrder',
        [
          expect.objectContaining({
            symbol: 'ETH',
            isBuy: true,
            orderType: 'market',
            trackingData: expect.objectContaining({
              hlFeeRate: 0.00045,
              // No existing position -> create_position; the controller only
              // emits the tx `action` when trackingData.tradeAction is set.
              tradeAction: PERPS_EVENT_VALUE.ACTION.CREATE_POSITION,
            }),
          }),
        ],
      );
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH', {
        replace: true,
      });
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastSubmitInProgress',
          description: expect.stringMatching(/^Long [^ ]+ ETH$/u),
        }),
      );
      expect(mockSetPendingOrder).toHaveBeenCalledWith({
        symbol: 'ETH',
        filledDescription: expect.stringMatching(/^Long [^ ]+ ETH$/u),
      });
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastOrderSubmitted',
          autoHideTime: 3000,
        }),
      );
    });

    it('does not duplicate symbol in toast description for HIP3 markets (TAT-3053)', async () => {
      // HIP3 market symbol is "xyz:TSLA" but positionSize uses the display name "TSLA".
      // The strip logic must match against the display name, not the raw symbol,
      // otherwise the toast reads "Long 0.5 TSLA TSLA" instead of "Long 0.5 TSLA".
      mockUseParams.mockReturnValue({ symbol: 'xyz%3ATSLA' });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const input = amountContainer.querySelector('input');
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '1000' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/xyz%3ATSLA', {
        replace: true,
      });
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastSubmitInProgress',
          description: expect.stringMatching(/^Long [^ ]+ TSLA$/u),
        }),
      );
    });

    it('shows order failure toast when order fails', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsPlaceOrder') {
          return Promise.resolve({
            success: false,
            error: 'Insufficient margin',
          });
        }
        return Promise.resolve({ success: true });
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const input = amountContainer.querySelector('input');
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '1000' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockHidePerpsToast).toHaveBeenCalledTimes(1);
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastOrderFailed',
        description: 'Insufficient margin to place this order.',
      });
    });

    it('shows order failure toast when controller throws', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsPlaceOrder') {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ success: true });
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const input = amountContainer.querySelector('input');
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '1000' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockHidePerpsToast).toHaveBeenCalledTimes(1);
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastOrderFailed',
        description: 'A network error occurred. Please try again.',
      });
    });

    it('calls closePosition when in close mode', async () => {
      mockSearchParams.set('mode', 'close');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsClosePosition',
        [
          expect.objectContaining({
            symbol: 'ETH',
            orderType: 'market',
            currentPrice: 3025.5,
            trackingData: expect.objectContaining({
              totalFee: expect.any(Number),
              marketPrice: 3025.5,
              hlFeeRate: 0.00045,
            }),
          }),
        ],
      );
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH', {
        replace: true,
      });
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastCloseInProgress',
          description: expect.stringMatching(/^Long [^ ]+ ETH$/u),
        }),
      );
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastTradeSuccess',
        description: expect.stringMatching(/^Your PnL is -?\d+\.\d{2}%$/u),
      });
    });

    it('calls closePosition with size for partial close mode', async () => {
      mockSearchParams.set('mode', 'close');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const slider = within(
        screen.getByTestId('close-amount-slider-pct-100'),
      ).getByRole('slider');
      fireEvent.change(slider, { target: { value: '99' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsClosePosition',
        [
          expect.objectContaining({
            symbol: 'ETH',
            orderType: 'market',
            currentPrice: 3025.5,
            size: expect.any(String),
          }),
        ],
      );
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH', {
        replace: true,
      });
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastPartialCloseInProgress',
          description: expect.stringMatching(/^Long [^ ]+ ETH$/u),
        }),
      );
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastPartialCloseSuccess',
        }),
      );
    });

    it('falls back to close subtitle when close PnL cannot be calculated', async () => {
      mockSearchParams.set('mode', 'close');
      mockLivePositions.mockReturnValue({
        positions: [
          {
            ...mockPositions[0],
            marginUsed: '0',
            unrealizedPnl: 'not-a-number',
            returnOnEquity: 'not-a-number',
          },
        ],
        isInitialLoading: false,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH', {
        replace: true,
      });
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastCloseInProgress',
          description: expect.stringMatching(/^Long [^ ]+ ETH$/u),
        }),
      );
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastTradeSuccess',
        description: expect.stringMatching(/^Long [^ ]+ ETH$/u),
      });
    });

    it('uses the actual short position direction for full close toasts', async () => {
      mockSearchParams.set('mode', 'close');
      mockLivePositions.mockReturnValue({
        positions: [
          {
            ...mockPositions[0],
            size: '-4.95',
            marginUsed: '0',
            unrealizedPnl: 'not-a-number',
            returnOnEquity: 'not-a-number',
          },
        ],
        isInitialLoading: false,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH', {
        replace: true,
      });
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastCloseInProgress',
          description: expect.stringMatching(/^Short [^ ]+ ETH$/u),
        }),
      );
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastTradeSuccess',
        description: expect.stringMatching(/^Short [^ ]+ ETH$/u),
      });
    });

    it('uses ROE ratio for close subtitle fallback', async () => {
      mockSearchParams.set('mode', 'close');
      mockLivePositions.mockReturnValue({
        positions: [
          {
            ...mockPositions[0],
            marginUsed: '0',
            unrealizedPnl: 'not-a-number',
            returnOnEquity: '0.008',
          },
        ],
        isInitialLoading: false,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH', {
        replace: true,
      });
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastCloseInProgress',
        }),
      );
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastTradeSuccess',
        description: 'Your PnL is 0.80%',
      });
    });

    it('calls updatePositionTPSL when in modify mode', async () => {
      mockSearchParams.set('mode', 'modify');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsUpdatePositionTPSL',
        [
          expect.objectContaining({
            symbol: 'ETH',
          }),
        ],
      );
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH', {
        replace: true,
      });
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastUpdateInProgress',
        }),
      );
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastUpdateSuccess',
      });
    });

    it('navigates back after successful modify add-to-position market order', async () => {
      mockSearchParams.set('mode', 'modify');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const input = amountContainer.querySelector('input');
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '500' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsPlaceOrder',
        expect.arrayContaining([
          expect.objectContaining({
            symbol: 'ETH',
            orderType: 'market',
            trackingData: expect.objectContaining({
              hlFeeRate: 0.00045,
            }),
          }),
        ]),
      );
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH', {
        replace: true,
      });
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastSubmitInProgress',
        }),
      );
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastOrderPlaced',
        }),
      );
    });

    it('surfaces failure toast when modify add-to-position place order fails', async () => {
      mockSearchParams.set('mode', 'modify');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsPlaceOrder') {
          return Promise.resolve({
            success: false,
            error: 'Add to position failed',
          });
        }
        return Promise.resolve({ success: true });
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const input = amountContainer.querySelector('input');
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '500' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockUseNavigate).not.toHaveBeenCalled();
      // Modify mode has no shared inProgress toast key — hide is not called.
      expect(mockHidePerpsToast).not.toHaveBeenCalled();
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastSubmitInProgress',
        }),
      );
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastUpdateFailed',
        description: messages.somethingWentWrong.message,
      });
    });

    it('submits existing position TP/SL values unchanged in modify mode', async () => {
      mockSearchParams.set('mode', 'modify');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      // Auto-close section is hidden in modify mode; TP/SL inputs are not accessible
      expect(screen.queryByTestId('tp-price-input')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sl-price-input')).not.toBeInTheDocument();

      // Submitting with no additional amount calls perpsUpdatePositionTPSL
      // with the pre-loaded TP/SL values from the existing position
      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsUpdatePositionTPSL',
        [
          expect.objectContaining({
            symbol: 'ETH',
            takeProfitPrice: mockPositions[0].takeProfitPrice,
            stopLossPrice: mockPositions[0].stopLossPrice,
          }),
        ],
      );
    });

    it('does not disable submit in modify mode when pre-loaded TP has crossed market price', async () => {
      mockSearchParams.set('mode', 'modify');
      // Market has run above the existing TP ($3,200) — stale TP is now on the wrong
      // side of the current price for a long, which previously silently blocked submit.
      mockLiveMarketData.mockReturnValue({
        markets: mockCryptoMarkets.map((m) =>
          m.symbol === 'ETH' ? { ...m, price: '$3,500.00' } : m,
        ),
        isInitialLoading: false,
      });
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const submitButton = screen.getByTestId('submit-order-button');
      expect(submitButton).not.toBeDisabled();
    });

    it('does not submit when currentPrice is 0', async () => {
      mockLiveMarketData.mockReturnValue({
        markets: mockCryptoMarkets.map((m) => ({
          ...m,
          price: '$0',
        })),
        isInitialLoading: false,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsPlaceOrder',
        expect.anything(),
      );
    });

    it('routes market order with TP/SL on new position through two-step placeOrder + updatePositionTPSL', async () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      enterAmount('100');
      fireEvent.click(screen.getByTestId('auto-close-toggle'));

      const tpContainer = screen.getByTestId('tp-price-input');
      fireEvent.change(tpContainer.querySelector('input') as HTMLInputElement, {
        target: { value: '3300' },
      });
      const slContainer = screen.getByTestId('sl-price-input');
      fireEvent.change(slContainer.querySelector('input') as HTMLInputElement, {
        target: { value: '2800' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      const placeOrderCall = mockSubmitRequestToBackground.mock.calls.find(
        ([method]) => method === 'perpsPlaceOrder',
      );
      expect(placeOrderCall).toBeTruthy();
      expect(placeOrderCall?.[1][0]).not.toHaveProperty('takeProfitPrice');
      expect(placeOrderCall?.[1][0]).not.toHaveProperty('stopLossPrice');

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsUpdatePositionTPSL',
        [
          expect.objectContaining({
            symbol: 'ETH',
            takeProfitPrice: '3300',
            stopLossPrice: '2800',
            trackingData: expect.objectContaining({
              direction: 'long',
              source: 'trade_screen',
              isEditingExistingPosition: false,
            }),
          }),
        ],
      );
    });

    it('reports the NET position size to TP/SL tracking after a flip', async () => {
      // ETH position is long 2.5 at ~3025. $5000 at 3x buys ~4.958 ETH, so the
      // flip leaves ~2.458 ETH open — not the full 4.958 the order requested.
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      mockSearchParams.set('direction', 'short');
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsPlaceOrder') {
          return Promise.resolve({ success: true });
        }
        if (method === 'perpsUpdatePositionTPSL') {
          return Promise.resolve({ success: true });
        }
        return Promise.resolve(undefined);
      });

      renderWithProvider(<PerpsOrderEntryPage />, mockStore(createMockState()));

      enterAmount('5000');
      fireEvent.click(screen.getByTestId('auto-close-toggle'));
      const tpContainer = screen.getByTestId('tp-price-input');
      fireEvent.change(tpContainer.querySelector('input') as HTMLInputElement, {
        target: { value: '2000' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      const tpslCall = mockSubmitRequestToBackground.mock.calls.find(
        ([method]) => method === 'perpsUpdatePositionTPSL',
      );
      const orderCall = mockSubmitRequestToBackground.mock.calls.find(
        ([method]) => method === 'perpsPlaceOrder',
      );
      const requestedSize = Math.abs(
        Number.parseFloat(orderCall?.[1][0].size ?? '0'),
      );
      const reportedSize = tpslCall?.[1][0].trackingData.positionSize;

      // The controller publishes this as the risk event's position_size.
      expect(reportedSize).toBeCloseTo(requestedSize - 2.5, 5);
      expect(reportedSize).toBeLessThan(requestedSize);
    });

    it('reports TP/SL attach failure when the follow-up updatePositionTPSL call fails', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsUpdatePositionTPSL') {
          return Promise.resolve({
            success: false,
            error: 'TPSL attach failed',
          });
        }
        return Promise.resolve({ success: true });
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      enterAmount('100');
      fireEvent.click(screen.getByTestId('auto-close-toggle'));

      const tpContainer = screen.getByTestId('tp-price-input');
      fireEvent.change(tpContainer.querySelector('input') as HTMLInputElement, {
        target: { value: '3300' },
      });
      const slContainer = screen.getByTestId('sl-price-input');
      fireEvent.change(slContainer.querySelector('input') as HTMLInputElement, {
        target: { value: '2800' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsUpdatePositionTPSL',
        expect.anything(),
      );
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastUpdateFailed',
        }),
      );
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH', {
        replace: true,
      });
    });
  });

  describe('formStateToOrderParams', () => {
    it('sets reduceOnly and isFullClose for close mode', async () => {
      mockSearchParams.set('mode', 'close');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      mockSubmitRequestToBackground.mockResolvedValue({ success: true });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsClosePosition',
        expect.any(Array),
      );
    });
  });

  describe('market not found state', () => {
    it('renders back button on market not found', () => {
      mockUseParams.mockReturnValue({ symbol: 'UNKNOWN' });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(
        screen.getByTestId('perps-order-entry-back-button'),
      ).toBeInTheDocument();
    });

    it('navigates back when back button is clicked on market not found', () => {
      mockUseParams.mockReturnValue({ symbol: 'UNKNOWN' });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      fireEvent.click(screen.getByTestId('perps-order-entry-back-button'));
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/UNKNOWN', {
        replace: true,
      });
    });
  });

  describe('available balance', () => {
    it('renders when account is null', () => {
      mockLiveAccount.mockReturnValue({
        account: null,
        isInitialLoading: false,
      });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(
        screen.getByTestId('parent-selector-perps-order-entry'),
      ).toBeInTheDocument();
    });
  });

  describe('price subscriptions', () => {
    let priceCallback: (updates: unknown[]) => void;
    let orderBookCallback: (book: unknown) => void;

    beforeEach(() => {
      mockGetPerpsStreamManager.mockReturnValue({
        ...mockStreamManagerBase,
        prices: {
          subscribe: jest.fn((cb: (updates: unknown[]) => void) => {
            priceCallback = cb;
            return jest.fn();
          }) as jest.Mock,
          getCachedData: () => [],
        },
        orderBook: {
          subscribe: jest.fn((cb: (book: unknown) => void) => {
            orderBookCallback = cb;
            return jest.fn();
          }) as jest.Mock,
          getCachedData: () => null,
          clearCache: jest.fn(),
        },
      });
    });

    afterEach(() => {
      mockGetPerpsStreamManager.mockReturnValue(mockStreamManagerBase);
    });

    it('processes price updates from subscribeToPrices callback', async () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsActivatePriceStream',
        [{ symbols: ['ETH'], includeMarketData: true }],
      );

      await waitFor(() => {
        expect(typeof priceCallback).toBe('function');
      });

      act(() => {
        priceCallback([
          {
            symbol: 'ETH',
            price: '3200.50',
            timestamp: 1000,
            markPrice: '3201.00',
          },
        ]);
      });

      expect(
        screen.getByTestId('parent-selector-perps-order-entry'),
      ).toBeInTheDocument();
    });

    it('preserves missing markPrice when absent from the stream update', async () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await waitFor(() => {
        expect(typeof priceCallback).toBe('function');
      });

      act(() => {
        priceCallback([
          {
            symbol: 'ETH',
            price: '3100.00',
          },
        ]);
      });

      expect(
        screen.getByTestId('parent-selector-perps-order-entry'),
      ).toBeInTheDocument();
    });

    it('ignores price updates for other symbols', async () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await waitFor(() => {
        expect(typeof priceCallback).toBe('function');
      });

      act(() => {
        priceCallback([
          { symbol: 'BTC', price: '50000.00', markPrice: '50001.00' },
        ]);
      });

      expect(
        screen.getByTestId('parent-selector-perps-order-entry'),
      ).toBeInTheDocument();
    });

    it('processes order book updates from subscribeToOrderBook callback', async () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await waitFor(() => {
        expect(typeof orderBookCallback).toBe('function');
      });

      act(() => {
        orderBookCallback({
          bids: [{ price: '3199', size: '10' }],
          asks: [{ price: '3201', size: '10' }],
          midPrice: '3200.00',
        });
      });

      expect(
        screen.getByTestId('parent-selector-perps-order-entry'),
      ).toBeInTheDocument();
    });

    it('ignores empty order book updates', async () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await waitFor(() => {
        expect(typeof orderBookCallback).toBe('function');
      });

      act(() => {
        orderBookCallback({
          bids: [],
          asks: [],
          midPrice: null,
        });
      });

      expect(
        screen.getByTestId('parent-selector-perps-order-entry'),
      ).toBeInTheDocument();
    });
  });

  describe('order submission error paths', () => {
    beforeEach(() => {
      mockSubmitRequestToBackground.mockResolvedValue({ success: true });
    });

    it('shows close failure toast when closePosition fails', async () => {
      mockSearchParams.set('mode', 'close');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsClosePosition') {
          return Promise.resolve({ success: false, error: 'Close failed' });
        }
        return Promise.resolve({ success: true });
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockHidePerpsToast).toHaveBeenCalledTimes(1);
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastCloseFailed',
        description: "We couldn't load this page.",
      });
    });

    it('shows partial close failure toast when partial closePosition fails', async () => {
      mockSearchParams.set('mode', 'close');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsClosePosition') {
          return Promise.resolve({ success: false, error: 'Close failed' });
        }
        return Promise.resolve({ success: true });
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const slider = within(
        screen.getByTestId('close-amount-slider-pct-100'),
      ).getByRole('slider');
      fireEvent.change(slider, { target: { value: '99' } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockHidePerpsToast).toHaveBeenCalledTimes(1);
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastPartialCloseFailed',
        description: 'Your position is still active',
      });
      expect(screen.getByTestId('perps-order-submit-error')).toHaveTextContent(
        "We couldn't load this page.",
      );
    });

    it('shows update failure toast when updatePositionTPSL fails', async () => {
      mockSearchParams.set('mode', 'modify');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsUpdatePositionTPSL') {
          return Promise.resolve({
            success: false,
            error: 'TPSL update failed',
          });
        }
        return Promise.resolve({ success: true });
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockHidePerpsToast).not.toHaveBeenCalled();
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastUpdateFailed',
        description: "We couldn't load this page.",
      });
    });

    it('shows fallback order failure toast for non-Error throws', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsPlaceOrder') {
          return Promise.reject('string error');
        }
        return Promise.resolve({ success: true });
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const input = amountContainer.querySelector('input');
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '1000' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(
        screen.queryByText('An unknown error occurred'),
      ).not.toBeInTheDocument();
      expect(mockHidePerpsToast).toHaveBeenCalledTimes(1);
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastOrderFailed',
        description: 'Your funds have been returned to you',
      });
    });

    it('navigates back after successful limit order', async () => {
      mockSearchParams.set('orderType', 'limit');

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const amountInput = amountContainer.querySelector('input');
      fireEvent.change(amountInput as HTMLInputElement, {
        target: { value: '500' },
      });

      const limitContainer = screen.getByTestId('limit-price-input');
      const limitInput = limitContainer.querySelector('input');
      fireEvent.change(limitInput as HTMLInputElement, {
        target: { value: '3000' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsPlaceOrder',
        [
          expect.objectContaining({
            orderType: 'limit',
            price: '3000',
          }),
        ],
      );
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH', {
        replace: true,
      });
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastSubmitInProgress',
        }),
      );
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastOrderPlaced',
          autoHideTime: 3000,
        }),
      );
    });

    it('does not submit a limit order when locale-formatted limit price is entered', async () => {
      mockSearchParams.set('orderType', 'limit');

      const store = mockStore(createMockStateWithLocale('de'));
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const amountInput = amountContainer.querySelector('input');
      fireEvent.change(amountInput as HTMLInputElement, {
        target: { value: '500' },
      });

      const limitContainer = screen.getByTestId('limit-price-input');
      const limitInput = limitContainer.querySelector('input');
      fireEvent.focus(limitInput as HTMLInputElement);
      fireEvent.change(limitInput as HTMLInputElement, {
        target: { value: '45.050,00' },
      });
      fireEvent.blur(limitInput as HTMLInputElement);

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      const placeOrderCalls = mockSubmitRequestToBackground.mock.calls.filter(
        ([method]) => method === 'perpsPlaceOrder',
      );
      expect(placeOrderCalls).toHaveLength(0);
    });
  });

  describe('pending order effects', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      mockSubmitRequestToBackground.mockResolvedValue({ success: true });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('navigates immediately to market detail with pendingOrderSymbol for market order', async () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const input = amountContainer.querySelector('input');
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '1000' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH', {
        replace: true,
      });
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastSubmitInProgress',
          description: expect.stringMatching(/^Long [^ ]+ ETH$/u),
        }),
      );
      expect(mockSetPendingOrder).toHaveBeenCalledWith({
        symbol: 'ETH',
        filledDescription: expect.stringMatching(/^Long [^ ]+ ETH$/u),
      });
    });
  });
});
