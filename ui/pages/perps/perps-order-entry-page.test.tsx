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
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { MetaMetricsContext } from '../../contexts/metametrics';
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
import PerpsOrderEntryPage, {
  shouldShowPerpsOrderSubmissionToasts,
} from './perps-order-entry-page';

const mockUsePerpsMarketInfo = jest.fn(() => undefined);

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

const mockUsePerpsEligibility = jest.fn(() => ({ isEligible: true }));
jest.mock('../../hooks/perps/usePerpsEligibility', () => ({
  usePerpsEligibility: () => mockUsePerpsEligibility(),
}));

jest.mock('../../hooks/perps/usePerpsMarketInfo', () => ({
  usePerpsMarketInfo: () => mockUsePerpsMarketInfo(),
}));

jest.mock('../../hooks/perps/usePerpsOrderFees', () => ({
  usePerpsOrderFees: () => ({ feeRate: 0.00145, isLoading: false }),
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

      expect(screen.getByTestId('submit-order-button')).toHaveTextContent(
        'Open long',
      );
    });

    it('respects direction=short search param', () => {
      mockSearchParams.set('direction', 'short');
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

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
      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
    });

    it('navigates back in history for encoded symbol markets', () => {
      mockUseParams.mockReturnValue({ symbol: 'xyz%3ATSLA' });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      fireEvent.click(screen.getByTestId('perps-order-entry-back-button'));
      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
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
          availableBalance: '0',
          availableToTradeBalance: '0',
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
          availableBalance: '0',
          availableToTradeBalance: '0',
          totalBalance: '0',
        },
        isInitialLoading: false,
      });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const submitButton = screen.getByTestId('submit-order-button');
      expect(submitButton).toBeDisabled();
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
          availableBalance: '0',
          availableToTradeBalance: '0',
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
      // availableBalance is 10125, default leverage is 3, so max amount = 30375
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
      const mockTrackEvent = jest.fn();
      const mockMetaMetricsContext = {
        trackEvent: mockTrackEvent,
        bufferedTrace: jest.fn(),
        bufferedEndTrace: jest.fn(),
        onboardingParentContext: { current: null },
      };

      const store = mockStore(createMockState());
      renderWithProvider(
        <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
          <PerpsOrderEntryPage />
        </MetaMetricsContext.Provider>,
        store,
      );

      const screenViewedCalls = mockTrackEvent.mock.calls.filter(
        ([arg]) => arg?.event === MetaMetricsEventName.PerpsScreenViewed,
      );

      expect(screenViewedCalls).toHaveLength(1);
      expect(screenViewedCalls[0][0]).toEqual(
        expect.objectContaining({
          event: MetaMetricsEventName.PerpsScreenViewed,
          category: MetaMetricsEventCategory.Perps,
          properties: expect.objectContaining({
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

    it('tracks has_perp_balance as true when unified funds are tradeable but not withdrawable', () => {
      mockLiveAccount.mockReturnValue({
        account: {
          ...mockAccountState,
          availableBalance: '0',
          availableToTradeBalance: '100',
        },
        isInitialLoading: false,
      });

      const hasPerpBalance = renderWithTracking();

      expect(hasPerpBalance).toBe(true);
    });

    it('falls back to availableBalance when availableToTradeBalance is absent', () => {
      mockLiveAccount.mockReturnValue({
        account: {
          ...mockAccountState,
          availableBalance: '100',
          availableToTradeBalance: undefined,
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
          availableBalance: '0',
          availableToTradeBalance: '0',
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
          }),
        ],
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
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

      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
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
          {
            symbol: 'ETH',
            orderType: 'market',
            currentPrice: 3025.5,
          },
        ],
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
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
        screen.getByTestId('close-amount-slider'),
      ).getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });

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
      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
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

      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
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

      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
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

      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
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
      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
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
          }),
        ]),
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
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
      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
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
        screen.getByTestId('close-amount-slider'),
      ).getByRole('slider');
      slider.focus();
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });

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
      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
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

      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
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
