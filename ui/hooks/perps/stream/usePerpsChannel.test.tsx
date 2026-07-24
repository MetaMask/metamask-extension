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

  it('keeps the channel empty when a prior-identity packet arrives after reset, even if the new subscription reports connected', () => {
    const manager = new PerpsStreamManager();
    manager.init('0xacc');

    const oldBook: OrderBookData = {
      bids: [
        {
          price: '73775',
          size: '0.04',
          total: '0.04',
          notional: '2967',
          totalNotional: '2967',
        },
      ],
      asks: [],
      spread: '2',
      spreadPercentage: '0.0027',
      midPrice: '73776',
      lastUpdated: 1,
      maxTotal: '0.04',
    };

    const oldIdentity = 'BTC:4::0';
    const newIdentity = 'BTC:5::0';

    manager.setActiveOrderBookAggregatedSubscriptionId(oldIdentity);
    manager.handleBackgroundUpdate({
      channel: 'orderBookAggregated',
      data: oldBook,
      subscriptionId: oldIdentity,
    });

    mockUsePerpsStreamManager.mockReturnValue({
      streamManager: manager,
      isInitializing: false,
      error: null,
      selectedAddress: '0xacc',
    });

    const { result, rerender } = renderHook(
      ({ key }: { key: string }) =>
        usePerpsChannel((sm) => sm.orderBookAggregated, EMPTY_ORDER_BOOK, key),
      { initialProps: { key: oldIdentity } },
    );

    expect(result.current.data).toStrictEqual(oldBook);
    expect(result.current.isInitialLoading).toBe(false);

    // Grouping change: UI switches identity and clears the channel before the
    // background finishes tearing down the old socket.
    act(() => {
      manager.setActiveOrderBookAggregatedSubscriptionId(newIdentity);
    });
    rerender({ key: newIdentity });

    expect(result.current.data).toBeNull();
    expect(result.current.isInitialLoading).toBe(true);

    // Late packet from the prior grouping arrives during the IPC gap.
    act(() => {
      manager.handleBackgroundUpdate({
        channel: 'orderBookAggregated',
        data: oldBook,
        subscriptionId: oldIdentity,
      });
    });

    expect(result.current.data).toBeNull();
    expect(manager.orderBookAggregated.hasCachedData()).toBe(false);

    // New subscription reports connected before its first snapshot — an
    // ordering the controller permits. Old rows must still not render.
    act(() => {
      manager.handleBackgroundUpdate({
        channel: 'orderBookAggregatedStatus',
        data: 'connected',
        subscriptionId: newIdentity,
      });
    });

    expect(result.current.data).toBeNull();
    expect(result.current.isInitialLoading).toBe(true);
    expect(manager.orderBookAggregated.hasCachedData()).toBe(false);
  });

  it('rejects a late packet after close so reopen does not render stale rows', () => {
    const manager = new PerpsStreamManager();
    manager.init('0xacc');

    const closedBook: OrderBookData = {
      bids: [
        {
          price: '100',
          size: '1',
          total: '1',
          notional: '100',
          totalNotional: '100',
        },
      ],
      asks: [],
      spread: '1',
      spreadPercentage: '1',
      midPrice: '100.5',
      lastUpdated: 1,
      maxTotal: '1',
    };

    const closedIdentity = 'BTC:5::1';
    const reopenIdentity = 'BTC:5::2';

    manager.setActiveOrderBookAggregatedSubscriptionId(closedIdentity);
    manager.handleBackgroundUpdate({
      channel: 'orderBookAggregated',
      data: closedBook,
      subscriptionId: closedIdentity,
    });
    expect(manager.orderBookAggregated.hasCachedData()).toBe(true);

    // Close the panel: deregister and clear (mirrors unmount cleanup).
    manager.setActiveOrderBookAggregatedSubscriptionId(null);
    manager.orderBookAggregated.clearCache();

    // Late packet from the closed subscription arrives while nothing is active.
    manager.handleBackgroundUpdate({
      channel: 'orderBookAggregated',
      data: closedBook,
      subscriptionId: closedIdentity,
    });
    expect(manager.orderBookAggregated.hasCachedData()).toBe(false);

    // Reopen with a never-reused identity (same config, new generation).
    manager.setActiveOrderBookAggregatedSubscriptionId(reopenIdentity);

    mockUsePerpsStreamManager.mockReturnValue({
      streamManager: manager,
      isInitializing: false,
      error: null,
      selectedAddress: '0xacc',
    });

    const { result } = renderHook(() =>
      usePerpsChannel(
        (sm) => sm.orderBookAggregated,
        EMPTY_ORDER_BOOK,
        reopenIdentity,
      ),
    );

    expect(result.current.data).toBeNull();
    expect(result.current.isInitialLoading).toBe(true);
    expect(manager.orderBookAggregated.hasCachedData()).toBe(false);
  });
});
