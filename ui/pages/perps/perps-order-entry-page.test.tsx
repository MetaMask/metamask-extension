import type {
  AccountState,
  Position,
  PerpsMarketData,
} from '@metamask/perps-controller';
import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import mockState from '../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import {
  mockPositions,
  mockAccountState,
  mockCryptoMarkets,
  mockHip3Markets,
} from '../../components/app/perps/mocks';
import PerpsOrderEntryPage from './perps-order-entry-page';

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

jest.mock('../../hooks/perps/usePerpsEligibility', () => ({
  usePerpsEligibility: () => ({ isEligible: true }),
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
jest.mock('../../components/app/perps/perps-toast', () => {
  const { PERPS_TOAST_KEYS } = jest.requireActual(
    '../../components/app/perps/perps-toast/perps-toast-provider',
  );

  return {
    PERPS_TOAST_KEYS,
    usePerpsToast: () => ({
      replacePerpsToastByKey: mockReplacePerpsToastByKey,
      hidePerpsToast: mockHidePerpsToast,
    }),
  };
});
jest.mock('../../providers/perps', () => {
  return {
    getPerpsStreamManager: () => mockGetPerpsStreamManager(),
  };
});

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
    const { isNearLiquidationPrice: realIsNearLiquidation } =
      jest.requireActual(
        '../../components/app/perps/order-entry/limit-price-warnings',
      );
    mockIsNearLiquidationPrice.mockImplementation(realIsNearLiquidation);
    mockReplacePerpsToastByKey.mockReset();
    mockHidePerpsToast.mockReset();
    mockUseParams.mockReturnValue({ symbol: 'ETH' });
    mockSearchParams.delete('direction');
    mockSearchParams.delete('mode');
    mockSearchParams.delete('orderType');
    mockLivePositions.mockReturnValue({
      positions: [],
      isInitialLoading: false,
    });
    mockLiveAccount.mockReturnValue({
      account: mockAccountState,
      isInitialLoading: false,
    });
    mockLiveMarketData.mockReturnValue({
      markets: [...mockCryptoMarkets, ...mockHip3Markets],
      isInitialLoading: false,
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
        'Open Long ETH',
      );
    });

    it('renders the direction tabs', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(screen.getByText(messages.perpsLong.message)).toBeInTheDocument();
      expect(screen.getByText(messages.perpsShort.message)).toBeInTheDocument();
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
        'Open Long',
      );
    });

    it('respects direction=short search param', () => {
      mockSearchParams.set('direction', 'short');
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(screen.getByTestId('submit-order-button')).toHaveTextContent(
        'Open Short',
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
        'Close Long',
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
    it('navigates back to market detail when back button is clicked', () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      fireEvent.click(screen.getByTestId('perps-order-entry-back-button'));
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH');
    });

    it('navigates back for encoded symbol', () => {
      mockUseParams.mockReturnValue({ symbol: 'xyz%3ATSLA' });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      fireEvent.click(screen.getByTestId('perps-order-entry-back-button'));
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/xyz%3ATSLA');
    });
  });

  describe('submit button disabled states', () => {
    it('disables submit when limit order has no price', () => {
      mockSearchParams.set('orderType', 'limit');
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
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastSubmitInProgress',
        }),
      );
      expect(mockReplacePerpsToastByKey).not.toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastSubmitInProgress',
          description: expect.any(String),
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
          }),
        ],
      );
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastCloseInProgress',
          description: expect.stringMatching(/^Long [^ ]+ ETH$/u),
        }),
      );
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH', {
        state: expect.objectContaining({
          perpsToastKey: 'perpsToastTradeSuccess',
          perpsToastDescription: expect.stringMatching(
            /^Your PnL is -?\d+\.\d{2}%$/u,
          ),
        }),
      });
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
        state: expect.objectContaining({
          perpsToastKey: 'perpsToastTradeSuccess',
          perpsToastDescription: expect.stringMatching(/^Long [^ ]+ ETH$/u),
        }),
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
        state: expect.objectContaining({
          perpsToastKey: 'perpsToastTradeSuccess',
          perpsToastDescription: 'Your PnL is 0.80%',
        }),
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
        state: expect.objectContaining({
          perpsToastKey: 'perpsToastUpdateSuccess',
        }),
      });
      expect(mockReplacePerpsToastByKey).not.toHaveBeenCalledWith({
        key: 'perpsToastUpdateInProgress',
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
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH', {
        state: expect.objectContaining({
          perpsToastKey: 'perpsToastOrderPlaced',
        }),
      });
    });

    it('submits normalized TP/SL values when modified', async () => {
      mockSearchParams.set('mode', 'modify');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const tpContainer = screen.getByTestId('tp-price-input');
      const tpInput = tpContainer.querySelector('input');
      fireEvent.change(tpInput as HTMLInputElement, {
        target: { value: '3300.1' },
      });
      fireEvent.blur(tpInput as HTMLInputElement);

      const slContainer = screen.getByTestId('sl-price-input');
      const slInput = slContainer.querySelector('input');
      fireEvent.change(slInput as HTMLInputElement, {
        target: { value: '2500' },
      });
      fireEvent.blur(slInput as HTMLInputElement);

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsUpdatePositionTPSL',
        [
          expect.objectContaining({
            symbol: 'ETH',
            takeProfitPrice: '3300.1',
            stopLossPrice: '2500',
          }),
        ],
      );
    });

    it('submits undefined TP/SL values when fields are cleared', async () => {
      mockSearchParams.set('mode', 'modify');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const tpContainer = screen.getByTestId('tp-price-input');
      const tpInput = tpContainer.querySelector('input');
      fireEvent.change(tpInput as HTMLInputElement, {
        target: { value: '' },
      });
      fireEvent.blur(tpInput as HTMLInputElement);

      const slContainer = screen.getByTestId('sl-price-input');
      const slInput = slContainer.querySelector('input');
      fireEvent.change(slInput as HTMLInputElement, {
        target: { value: '' },
      });
      fireEvent.blur(slInput as HTMLInputElement);

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      const updateCall = mockSubmitRequestToBackground.mock.calls.find(
        ([method]) => method === 'perpsUpdatePositionTPSL',
      );
      expect(updateCall).toBeDefined();

      const payload = updateCall?.[1]?.[0] as {
        symbol?: string;
        takeProfitPrice?: string;
        stopLossPrice?: string;
      };
      expect(payload.symbol).toBe('ETH');
      expect(payload.takeProfitPrice).toBeUndefined();
      expect(payload.stopLossPrice).toBeUndefined();
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
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/UNKNOWN');
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
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastSubmitInProgress',
        }),
      );
      expect(mockReplacePerpsToastByKey).not.toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'perpsToastSubmitInProgress',
          description: expect.any(String),
        }),
      );
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH', {
        state: expect.objectContaining({
          perpsToastKey: 'perpsToastOrderPlaced',
          perpsToastDescription: expect.stringMatching(/^Long [^ ]+ ETH$/u),
        }),
      });
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

    it('navigates back when position appears after market order', async () => {
      const store = mockStore(createMockState());
      const { rerender } = renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const input = amountContainer.querySelector('input');
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '1000' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      mockLivePositions.mockReturnValue({
        positions: [
          {
            ...mockPositions[0],
            symbol: 'ETH',
          },
        ],
        isInitialLoading: false,
      });

      await act(async () => {
        rerender(<PerpsOrderEntryPage />);
      });

      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH', {
        state: expect.objectContaining({
          perpsToastKey: 'perpsToastOrderFilled',
          perpsToastDescription: expect.stringMatching(/^Long [^ ]+ ETH$/u),
        }),
      });
    });

    it('navigates back after 15s timeout if position never appears', async () => {
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

      await act(async () => {
        jest.advanceTimersByTime(15000);
      });

      expect(mockHidePerpsToast).toHaveBeenCalledTimes(1);
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH');
    });
  });
});
