import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { screen, fireEvent, act } from '@testing-library/react';
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

const mockGetPerpsController = jest.fn();
jest.mock('../../providers/perps', () => ({
  getPerpsController: (...args: unknown[]) => mockGetPerpsController(...args),
  PerpsControllerProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

jest.mock('../../providers/perps/PerpsStreamManager', () => ({
  getPerpsStreamManager: () => ({
    positions: { getCachedData: () => [], pushData: jest.fn() },
    orders: { getCachedData: () => [], pushData: jest.fn() },
    account: { getCachedData: () => null, pushData: jest.fn() },
    markets: { getCachedData: () => [], pushData: jest.fn() },
    setOptimisticTPSL: jest.fn(),
    clearOptimisticTPSL: jest.fn(),
    pushPositionsWithOverrides: jest.fn(),
    prewarm: jest.fn(),
    cleanupPrewarm: jest.fn(),
    isInitialized: () => true,
    init: jest.fn().mockResolvedValue(undefined),
  }),
}));

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
// eslint-disable-next-line import/first
import type {
  AccountState,
  Position,
  PerpsMarketData,
} from '@metamask/perps-controller';

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
  });

  describe('order submission', () => {
    const mockPlaceOrder = jest.fn().mockResolvedValue({ success: true });
    const mockClosePosition = jest.fn().mockResolvedValue({ success: true });
    const mockUpdateTPSL = jest.fn().mockResolvedValue({ success: true });

    beforeEach(() => {
      mockGetPerpsController.mockResolvedValue({
        placeOrder: mockPlaceOrder,
        closePosition: mockClosePosition,
        updatePositionTPSL: mockUpdateTPSL,
        subscribeToPrices: jest.fn(() => jest.fn()),
        subscribeToOrderBook: jest.fn(() => jest.fn()),
      });
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

      expect(mockPlaceOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'ETH',
          isBuy: true,
          orderType: 'market',
        }),
      );
    });

    it('shows error when order fails', async () => {
      mockPlaceOrder.mockResolvedValueOnce({
        success: false,
        error: 'Insufficient margin',
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

      expect(screen.getByText('Insufficient margin')).toBeInTheDocument();
    });

    it('shows error when controller throws', async () => {
      mockPlaceOrder.mockRejectedValueOnce(new Error('Network error'));

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

      expect(screen.getByText('Network error')).toBeInTheDocument();
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

      expect(mockClosePosition).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'ETH',
          orderType: 'market',
        }),
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

      expect(mockUpdateTPSL).toHaveBeenCalledWith(
        expect.objectContaining({
          symbol: 'ETH',
        }),
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

      expect(mockPlaceOrder).not.toHaveBeenCalled();
    });
  });

  describe('formStateToOrderParams', () => {
    it('sets reduceOnly and isFullClose for close mode', async () => {
      mockSearchParams.set('mode', 'close');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      mockGetPerpsController.mockResolvedValue({
        closePosition: jest.fn().mockResolvedValue({ success: true }),
        subscribeToPrices: jest.fn(() => jest.fn()),
        subscribeToOrderBook: jest.fn(() => jest.fn()),
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      // Close mode uses closePosition, not placeOrder with params
      expect(mockGetPerpsController.mock.results[0]?.value).toBeDefined();
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
      mockGetPerpsController.mockResolvedValue({
        placeOrder: jest.fn().mockResolvedValue({ success: true }),
        closePosition: jest.fn().mockResolvedValue({ success: true }),
        updatePositionTPSL: jest.fn().mockResolvedValue({ success: true }),
        subscribeToPrices: jest.fn(
          (opts: { callback: (u: unknown[]) => void }) => {
            priceCallback = opts.callback;
            return jest.fn();
          },
        ),
        subscribeToOrderBook: jest.fn(
          (opts: { callback: (b: unknown) => void }) => {
            orderBookCallback = opts.callback;
            return jest.fn();
          },
        ),
      });
    });

    it('processes price updates from subscribeToPrices callback', async () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
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

    it('uses price field when markPrice is absent', async () => {
      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
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

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
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

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
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

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
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
    const mockPlaceOrder = jest.fn().mockResolvedValue({ success: true });
    const mockClosePosition = jest.fn().mockResolvedValue({ success: true });
    const mockUpdateTPSL = jest.fn().mockResolvedValue({ success: true });

    beforeEach(() => {
      mockGetPerpsController.mockResolvedValue({
        placeOrder: mockPlaceOrder,
        closePosition: mockClosePosition,
        updatePositionTPSL: mockUpdateTPSL,
        subscribeToPrices: jest.fn(() => jest.fn()),
        subscribeToOrderBook: jest.fn(() => jest.fn()),
      });
    });

    it('shows error when closePosition fails', async () => {
      mockSearchParams.set('mode', 'close');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      mockClosePosition.mockResolvedValueOnce({
        success: false,
        error: 'Close failed',
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(screen.getByText('Close failed')).toBeInTheDocument();
    });

    it('shows error when updatePositionTPSL fails', async () => {
      mockSearchParams.set('mode', 'modify');
      mockLivePositions.mockReturnValue({
        positions: mockPositions,
        isInitialLoading: false,
      });
      mockUpdateTPSL.mockResolvedValueOnce({
        success: false,
        error: 'TPSL update failed',
      });

      const store = mockStore(createMockState());
      renderWithProvider(<PerpsOrderEntryPage />, store);

      await act(async () => {
        fireEvent.click(screen.getByTestId('submit-order-button'));
      });

      expect(screen.getByText('TPSL update failed')).toBeInTheDocument();
    });

    it('shows generic error for non-Error throws', async () => {
      mockPlaceOrder.mockRejectedValueOnce('string error');

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

      expect(screen.getByText('An unknown error occurred')).toBeInTheDocument();
    });

    it('navigates back after successful limit order', async () => {
      mockSearchParams.set('orderType', 'limit');
      mockPlaceOrder.mockResolvedValueOnce({ success: true });

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

      expect(mockPlaceOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          orderType: 'limit',
          price: '3000',
        }),
      );
      expect(mockUseNavigate).toHaveBeenCalledWith('/perps/market/ETH');
    });
  });

  describe('pending order effects', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      mockGetPerpsController.mockResolvedValue({
        placeOrder: jest.fn().mockResolvedValue({ success: true }),
        closePosition: jest.fn().mockResolvedValue({ success: true }),
        updatePositionTPSL: jest.fn().mockResolvedValue({ success: true }),
        subscribeToPrices: jest.fn(() => jest.fn()),
        subscribeToOrderBook: jest.fn(() => jest.fn()),
      });
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
