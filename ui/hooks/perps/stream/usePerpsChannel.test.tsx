import { renderHook, act } from '@testing-library/react-hooks';
import type { OrderBookData } from '@metamask/perps-controller';
import { PerpsStreamManager } from '../../../providers/perps/PerpsStreamManager';
import { usePerpsChannel } from './usePerpsChannel';
import { usePerpsStreamManager } from './usePerpsStreamManager';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../providers/perps/CandleStreamChannel', () => ({
  CandleStreamChannel: jest.fn().mockImplementation(() => ({
    clearAll: jest.fn(),
  })),
}));

jest.mock('./usePerpsStreamManager');

const mockUsePerpsStreamManager = usePerpsStreamManager as jest.MockedFunction<
  typeof usePerpsStreamManager
>;

let uuidCounter = 0;
Object.defineProperty(globalThis, 'crypto', {
  value: {
    ...globalThis.crypto,
    randomUUID: () => `test-uuid-${(uuidCounter += 1)}`,
  },
});

const EMPTY_ORDER_BOOK: OrderBookData | null = null;

describe('usePerpsChannel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uuidCounter = 0;
  });

  it('returns empty value and loading when streamManager is null', () => {
    mockUsePerpsStreamManager.mockReturnValue({
      streamManager: null,
      isInitializing: true,
      error: null,
      selectedAddress: '0xabc',
    });

    const { result } = renderHook(() =>
      usePerpsChannel((sm) => sm.orderBook, EMPTY_ORDER_BOOK),
    );

    expect(result.current.data).toBeNull();
    expect(result.current.isInitialLoading).toBe(true);
  });

  it('returns empty value and loading while parent hook is still initializing', () => {
    const manager = new PerpsStreamManager();

    mockUsePerpsStreamManager.mockReturnValue({
      streamManager: manager,
      isInitializing: true,
      error: null,
      selectedAddress: '0xabc',
    });

    const { result } = renderHook(() =>
      usePerpsChannel((sm) => sm.orderBook, EMPTY_ORDER_BOOK),
    );

    expect(result.current.data).toBeNull();
    expect(result.current.isInitialLoading).toBe(true);
  });

  it('reads cached channel data when stream is ready', () => {
    const manager = new PerpsStreamManager();
    manager.init('0xacc');
    const book: OrderBookData = {
      bids: [],
      asks: [],
      spread: '',
      spreadPercentage: '',
      midPrice: '',
      lastUpdated: 0,
      maxTotal: '',
    };
    manager.orderBook.pushData(book);

    mockUsePerpsStreamManager.mockReturnValue({
      streamManager: manager,
      isInitializing: false,
      error: null,
      selectedAddress: '0xacc',
    });

    const { result } = renderHook(() =>
      usePerpsChannel((sm) => sm.orderBook, EMPTY_ORDER_BOOK),
    );

    expect(result.current.data).toStrictEqual(book);
    expect(result.current.isInitialLoading).toBe(false);
  });

  it('subscribes to live updates after the stream becomes ready', () => {
    const manager = new PerpsStreamManager();
    manager.init('0xacc');
    manager.orderBook.pushData({
      bids: [],
      asks: [],
      spread: '',
      spreadPercentage: '',
      midPrice: '',
      lastUpdated: 0,
      maxTotal: '',
    });

    mockUsePerpsStreamManager.mockReturnValue({
      streamManager: manager,
      isInitializing: false,
      error: null,
      selectedAddress: '0xacc',
    });

    const { result } = renderHook(() =>
      usePerpsChannel((sm) => sm.orderBook, EMPTY_ORDER_BOOK),
    );

    expect(result.current.isInitialLoading).toBe(false);

    const updated: OrderBookData = {
      bids: [
        {
          price: '1',
          size: '2',
          total: '',
          notional: '',
          totalNotional: '',
        },
      ],
      asks: [],
      spread: '',
      spreadPercentage: '',
      midPrice: '',
      lastUpdated: 0,
      maxTotal: '',
    };

    act(() => {
      manager.orderBook.pushData(updated);
    });

    expect(result.current.data).toStrictEqual(updated);
  });

  it('shows loading when channel has no cached data after stream is ready', () => {
    const manager = new PerpsStreamManager();
    manager.init('0xacc');

    mockUsePerpsStreamManager.mockReturnValue({
      streamManager: manager,
      isInitializing: false,
      error: null,
      selectedAddress: '0xacc',
    });

    const { result } = renderHook(() =>
      usePerpsChannel((sm) => sm.orderBook, EMPTY_ORDER_BOOK),
    );

    expect(result.current.data).toBeNull();
    expect(result.current.isInitialLoading).toBe(true);
  });

  it('clears cache and resets loading when resetKey changes', () => {
    const manager = new PerpsStreamManager();
    manager.init('0xacc');
    manager.orderBook.pushData({
      bids: [],
      asks: [],
      spread: '',
      spreadPercentage: '',
      midPrice: '',
      lastUpdated: 0,
      maxTotal: '',
    });
    const clearSpy = jest.spyOn(manager.orderBook, 'clearCache');

    mockUsePerpsStreamManager.mockReturnValue({
      streamManager: manager,
      isInitializing: false,
      error: null,
      selectedAddress: '0xacc',
    });

    const { result, rerender } = renderHook(
      ({ key }: { key: string }) =>
        usePerpsChannel((sm) => sm.orderBook, EMPTY_ORDER_BOOK, key),
      { initialProps: { key: 'BTC' } },
    );

    expect(result.current.isInitialLoading).toBe(false);
    expect(clearSpy).not.toHaveBeenCalled();

    rerender({ key: 'ETH' });

    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBeNull();
    expect(result.current.isInitialLoading).toBe(true);
  });
});
