import type {
  AccountState,
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
  usePerpsOrderFees: () => ({ feeRate: 0.00145, isLoading: false }),
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
  orderBook: { subscribe: jest.fn(() => jest.fn()), getCachedData: () => null },
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
      },
    },
  });

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

  describe('rendering', () => {
    it('renders the page with order entry form', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(screen.getByTestId('perps-order-entry-page')).toBeInTheDocument();
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
        screen.queryByTestId('perps-order-entry-page'),
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

    it('emits CONSIDERED with flip_long_to_short for a short order on a long position', async () => {
      // ETH position is long (size 2.5); a short order flips it.
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
      expect(consideredCalls()[0][0].properties).toEqual(
        expect.objectContaining({
          [PERPS_EVENT_PROPERTY.ACTION]:
            PERPS_EVENT_VALUE.ACTION.FLIP_LONG_TO_SHORT,
        }),
      );
    });

    it('emits CONSIDERED with flip_short_to_long for a long order on a short position', async () => {
      // BTC position is short (size -0.5); a long order flips it.
      mockUseParams.mockReturnValue({ symbol: 'BTC' });
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      mockSearchParams.set('direction', 'long');
      renderWithProvider(<PerpsOrderEntryPage />, mockStore(createMockState()));

      enterAmount('100');

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
        markets: [],
        isInitialLoading: false,
      });
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
              hlFeeRate: 0.00145,
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

    it('does not duplicate symbol in toast description for HIP3 markets', async () => {
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
              hlFeeRate: 0.00145,
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
              hlFeeRate: 0.00145,
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
        description: "We couldn't load this page.",
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

      expect(screen.getByTestId('perps-order-entry-page')).toBeInTheDocument();
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

      expect(screen.getByTestId('perps-order-entry-page')).toBeInTheDocument();
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

      expect(screen.getByTestId('perps-order-entry-page')).toBeInTheDocument();
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

      expect(screen.getByTestId('perps-order-entry-page')).toBeInTheDocument();
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

      expect(screen.getByTestId('perps-order-entry-page')).toBeInTheDocument();
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

      expect(screen.getByTestId('perps-order-entry-page')).toBeInTheDocument();
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
          // eslint-disable-next-line prefer-promise-reject-errors
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
