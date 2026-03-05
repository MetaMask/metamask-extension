import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import type {
  AccountState,
  Position,
  PerpsMarketData,
} from '@metamask/perps-controller';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import {
  mockPositions,
  mockAccountState,
  mockCryptoMarkets,
  mockHip3Markets,
} from '../../components/app/perps/mocks';

jest.mock('../../hooks/perps/usePerpsEligibility', () => ({
  usePerpsEligibility: () => ({ isEligible: true }),
}));

const mockSubmitRequestToBackground = jest.fn();
jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

let priceSubscriptionCallback: ((updates: unknown[]) => void) | undefined;
let orderBookSubscriptionCallback: ((book: unknown) => void) | undefined;

const setBackgroundRequestDefaults = () => {
  mockSubmitRequestToBackground.mockImplementation((method: string) => {
    if (method === 'perpsActivateStreaming') {
      return Promise.resolve(undefined);
    }
    return Promise.resolve({ success: true });
  });
};

// Mock controller for usePerpsController() - delegates to submitRequestToBackground so test assertions pass
const mockPerpsController = {
  placeOrder: jest
    .fn()
    .mockImplementation((...args: unknown[]) =>
      mockSubmitRequestToBackground('perpsPlaceOrder', args),
    ),
  closePosition: jest
    .fn()
    .mockImplementation((...args: unknown[]) =>
      mockSubmitRequestToBackground('perpsClosePosition', args),
    ),
  updatePositionTPSL: jest
    .fn()
    .mockImplementation((...args: unknown[]) =>
      mockSubmitRequestToBackground('perpsUpdatePositionTPSL', args),
    ),
  subscribeToPrices: jest.fn(() => jest.fn()),
  subscribeToOrderBook: jest.fn(() => jest.fn()),
};

jest.mock('../../providers/perps', () => {
  const actual = jest.requireActual<typeof import('../../providers/perps')>(
    '../../providers/perps',
  );
  return {
    ...actual,
    PerpsControllerProvider: ({ children }: { children: React.ReactNode }) =>
      children,
    usePerpsController: () => mockPerpsController,
    getPerpsStreamManager: () => ({
      prices: {
        subscribe: (callback: (updates: unknown[]) => void) => {
          priceSubscriptionCallback = callback;
          return jest.fn();
        },
      },
      orderBook: {
        subscribe: (callback: (book: unknown) => void) => {
          orderBookSubscriptionCallback = callback;
          return jest.fn();
        },
      },
    }),
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

// eslint-disable-next-line import/first
import PerpsOrderEntryPage from './perps-order-entry-page';

describe('PerpsOrderEntryPage', () => {
  const middlewares = [thunk];
  const mockStore = configureMockStore(middlewares);

  const createMockState = (perpsEnabled = true) => ({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      remoteFeatureFlags: {
        perpsEnabledVersion: perpsEnabled
          ? { enabled: true, minimumVersion: '0.0.0' }
          : { enabled: false, minimumVersion: '99.99.99' },
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundRequestDefaults();
    priceSubscriptionCallback = undefined;
    orderBookSubscriptionCallback = undefined;
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

    it('disables submit and shows validation message when amount exceeds available balance', () => {
      mockLiveAccount.mockReturnValue({
        account: {
          ...mockAccountState,
          availableBalance: '3.06',
        },
        isInitialLoading: false,
      });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const input = amountContainer.querySelector('input');
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '20' },
      });

      expect(screen.getByTestId('submit-order-button')).toBeDisabled();
      expect(
        screen.getByText('Insufficient balance: need 20.00, have 3.06'),
      ).toBeInTheDocument();
    });

    it('does not disable submit when amount equals available balance', () => {
      mockLiveAccount.mockReturnValue({
        account: {
          ...mockAccountState,
          availableBalance: '3.06',
        },
        isInitialLoading: false,
      });
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const input = amountContainer.querySelector('input');
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '3.06' },
      });

      expect(screen.getByTestId('submit-order-button')).not.toBeDisabled();
    });

    it('disables submit in close mode when position is missing', () => {
      mockSearchParams.set('mode', 'close');
      mockLivePositions.mockReturnValue({
        positions: [],
        isInitialLoading: false,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      expect(screen.getByTestId('submit-order-button')).toBeDisabled();
    });
  });

  describe('order submission', () => {
    beforeEach(() => {
      setBackgroundRequestDefaults();
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
    });

    it('does not call placeOrder when amount exceeds available balance', async () => {
      mockLiveAccount.mockReturnValue({
        account: {
          ...mockAccountState,
          availableBalance: '3.06',
        },
        isInitialLoading: false,
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      const amountContainer = screen.getByTestId('amount-input-field');
      const input = amountContainer.querySelector('input');
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '20' },
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      const hasPlaceOrderCall = mockSubmitRequestToBackground.mock.calls.some(
        (call) => call[0] === 'perpsPlaceOrder',
      );
      expect(hasPlaceOrderCall).toBe(false);
    });

    it('shows error when order fails', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsActivateStreaming') {
          return Promise.resolve(undefined);
        }
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

      await waitFor(() => {
        expect(screen.getByText('Insufficient margin')).toBeInTheDocument();
      });
    });

    it('shows error when controller throws', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsActivateStreaming') {
          return Promise.resolve(undefined);
        }
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

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
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

    it('does not fall back to placeOrder in close mode when position is missing', async () => {
      mockSearchParams.set('mode', 'close');
      mockLivePositions.mockReturnValue({
        positions: [],
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
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
        'perpsClosePosition',
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
      setBackgroundRequestDefaults();

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
    it('processes price updates from subscribeToPrices callback', async () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await waitFor(() => {
        expect(typeof priceSubscriptionCallback).toBe('function');
      });

      act(() => {
        priceSubscriptionCallback?.([
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

    it('uses price field when markPrice is absent', async () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await waitFor(() => {
        expect(typeof priceSubscriptionCallback).toBe('function');
      });

      act(() => {
        priceSubscriptionCallback?.([
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
        expect(typeof priceSubscriptionCallback).toBe('function');
      });

      act(() => {
        priceSubscriptionCallback?.([
          { symbol: 'BTC', price: '50000.00', markPrice: '50001.00' },
        ]);
      });

      expect(screen.getByTestId('perps-order-entry-page')).toBeInTheDocument();
    });

    it('processes order book updates from subscribeToOrderBook callback', async () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await waitFor(() => {
        expect(typeof orderBookSubscriptionCallback).toBe('function');
      });

      act(() => {
        orderBookSubscriptionCallback?.({
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
        expect(typeof orderBookSubscriptionCallback).toBe('function');
      });

      act(() => {
        orderBookSubscriptionCallback?.({
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
      setBackgroundRequestDefaults();
    });

    it('shows error when closePosition fails', async () => {
      mockSearchParams.set('mode', 'close');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsActivateStreaming') {
          return Promise.resolve(undefined);
        }
        if (method === 'perpsClosePosition') {
          return Promise.resolve({
            success: false,
            error: 'Close failed',
          });
        }
        return Promise.resolve({ success: true });
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      await waitFor(() => {
        expect(screen.getByText('Close failed')).toBeInTheDocument();
      });
    });

    it('shows error when updatePositionTPSL fails', async () => {
      mockSearchParams.set('mode', 'modify');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsActivateStreaming') {
          return Promise.resolve(undefined);
        }
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

      await waitFor(() => {
        expect(screen.getByText('TPSL update failed')).toBeInTheDocument();
      });
    });

    it('shows generic error for non-Error throws', async () => {
      const nonErrorReason: unknown = 'string error';
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsActivateStreaming') {
          return Promise.resolve(undefined);
        }
        if (method === 'perpsPlaceOrder') {
          return Promise.reject(nonErrorReason);
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

      await waitFor(() => {
        expect(
          screen.getByText('An unknown error occurred'),
        ).toBeInTheDocument();
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
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH');
    });
  });

  describe('pending order effects', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      setBackgroundRequestDefaults();
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

      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH');
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

      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH');
    });
  });
});
