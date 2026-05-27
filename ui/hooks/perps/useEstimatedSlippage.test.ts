import type { OrderBookData } from '@metamask/perps-controller';
import { act, renderHook } from '@testing-library/react-hooks';
import {
  computeSlippagePct,
  useEstimatedSlippage,
} from './useEstimatedSlippage';

jest.mock('../../providers/perps', () => {
  const internal = {
    subscribers: new Set(),
    unsubscribeSpy: jest.fn(),
  };
  return {
    mockInternals: internal,
    getPerpsStreamManager: () => ({
      orderBook: {
        subscribe: (cb: (...args: unknown[]) => unknown) => {
          internal.subscribers.add(cb);
          return () => {
            internal.subscribers.delete(cb);
            internal.unsubscribeSpy();
          };
        },
      },
    }),
  };
});

const { mockInternals: streamInternal } = jest.requireMock<{
  mockInternals: {
    subscribers: Set<(book: OrderBookData | null) => void>;
    unsubscribeSpy: jest.Mock;
  };
}>('../../providers/perps');

function emit(snapshot: OrderBookData | null) {
  for (const cb of Array.from(streamInternal.subscribers)) {
    cb(snapshot);
  }
}

function level(price: string, size: string): OrderBookData['asks'][number] {
  const total = size;
  const notional = String(Number(price) * Number(size));
  return { price, size, total, notional, totalNotional: notional };
}

function book(overrides: Partial<OrderBookData> = {}): OrderBookData {
  return {
    bids: [],
    asks: [],
    spread: '0',
    spreadPercentage: '0',
    midPrice: '100',
    lastUpdated: Date.now(),
    maxTotal: '0',
    ...overrides,
  };
}

describe('useEstimatedSlippage', () => {
  beforeEach(() => {
    streamInternal.subscribers.clear();
    streamInternal.unsubscribeSpy.mockClear();
    jest.useFakeTimers().setSystemTime(new Date('2026-05-13T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the empty result while the stream has not pushed a book yet', () => {
    const { result } = renderHook(() =>
      useEstimatedSlippage({
        symbol: 'BTC',
        notionalUsd: 100,
        direction: 'long',
      }),
    );
    expect(result.current).toStrictEqual({
      estimatedSlippagePct: null,
      insufficientLiquidity: false,
    });
  });

  it('computes slippage when the stream pushes a book', () => {
    const { result } = renderHook(() =>
      useEstimatedSlippage({
        symbol: 'BTC',
        notionalUsd: 210,
        direction: 'long',
      }),
    );
    act(() => {
      emit(
        book({
          asks: [level('100', '1'), level('110', '1')],
          midPrice: '100',
        }),
      );
    });
    expect(result.current.estimatedSlippagePct).toBeCloseTo(5, 5);
    expect(result.current.insufficientLiquidity).toBe(false);
  });

  it('throttles successive book updates to one per ORDER_BOOK_SAMPLE_MS window', () => {
    const { result } = renderHook(() =>
      useEstimatedSlippage({
        symbol: 'BTC',
        notionalUsd: 210,
        direction: 'long',
      }),
    );
    // First push lands.
    act(() => {
      emit(
        book({
          asks: [level('100', '1'), level('110', '1')],
          midPrice: '100',
        }),
      );
    });
    const firstPct = result.current.estimatedSlippagePct;
    expect(firstPct).toBeCloseTo(5, 5);

    // Second push within 500ms must be dropped (state stays equal).
    act(() => {
      jest.advanceTimersByTime(100);
      emit(
        book({
          asks: [level('100', '1'), level('120', '1')],
          midPrice: '100',
        }),
      );
    });
    expect(result.current.estimatedSlippagePct).toBeCloseTo(firstPct ?? 0, 5);

    // After the sample window closes, the next push is accepted.
    act(() => {
      jest.advanceTimersByTime(500);
      emit(
        book({
          asks: [level('100', '1'), level('120', '1')],
          midPrice: '100',
        }),
      );
    });
    expect(result.current.estimatedSlippagePct).toBeGreaterThan(firstPct ?? 0);
  });

  it('short-circuits when enabled=false and unsubscribes if it was previously subscribed', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useEstimatedSlippage({
          symbol: 'BTC',
          notionalUsd: 210,
          direction: 'long',
          enabled,
        }),
      { initialProps: { enabled: true } },
    );
    act(() => {
      emit(
        book({
          asks: [level('100', '1'), level('110', '1')],
          midPrice: '100',
        }),
      );
    });
    expect(result.current.estimatedSlippagePct).toBeCloseTo(5, 5);

    rerender({ enabled: false });
    expect(streamInternal.unsubscribeSpy).toHaveBeenCalledTimes(1);
    expect(result.current).toStrictEqual({
      estimatedSlippagePct: null,
      insufficientLiquidity: false,
    });
  });

  it('unsubscribes on unmount so the stream listener does not leak', () => {
    const { unmount } = renderHook(() =>
      useEstimatedSlippage({
        symbol: 'BTC',
        notionalUsd: 100,
        direction: 'long',
      }),
    );
    expect(streamInternal.subscribers.size).toBe(1);
    unmount();
    expect(streamInternal.unsubscribeSpy).toHaveBeenCalledTimes(1);
    expect(streamInternal.subscribers.size).toBe(0);
  });
});

describe('computeSlippagePct', () => {
  it('returns null + insufficientLiquidity=false when the book has no asks for a long', () => {
    const result = computeSlippagePct(book({ asks: [] }), 100, 'long');
    expect(result).toStrictEqual({
      estimatedSlippagePct: null,
      insufficientLiquidity: false,
    });
  });

  it('computes slippage from the ask side for a long', () => {
    // Notional 210 USD fully consumes 1@100 + 1@110 → avg 105 → 5% above mid.
    const result = computeSlippagePct(
      book({
        asks: [level('100', '1'), level('110', '1')],
        midPrice: '100',
      }),
      210,
      'long',
    );
    expect(result.insufficientLiquidity).toBe(false);
    expect(result.estimatedSlippagePct).toBeCloseTo(5, 5);
  });

  it('computes slippage from the bid side for a short', () => {
    // Notional 190 USD fully consumes 1@100 + 1@90 → avg 95 → 5% below mid.
    const result = computeSlippagePct(
      book({
        bids: [level('100', '1'), level('90', '1')],
        midPrice: '100',
      }),
      190,
      'short',
    );
    expect(result.insufficientLiquidity).toBe(false);
    expect(result.estimatedSlippagePct).toBeCloseTo(5, 5);
  });

  it('returns insufficientLiquidity when the book cannot fill the notional', () => {
    const result = computeSlippagePct(
      book({ asks: [level('100', '1')], midPrice: '100' }),
      1_000_000,
      'long',
    );
    expect(result).toStrictEqual({
      estimatedSlippagePct: null,
      insufficientLiquidity: true,
    });
  });

  it('clamps tiny negative rounding to zero rather than reporting negative slippage', () => {
    // Fill at exactly mid price → 0% (guards against -1e-15 from float math).
    const result = computeSlippagePct(
      book({ asks: [level('100', '10')], midPrice: '100' }),
      100,
      'long',
    );
    expect(result.estimatedSlippagePct).toBe(0);
  });

  it('skips malformed levels rather than throwing', () => {
    const result = computeSlippagePct(
      book({
        asks: [
          level('not-a-number', '1'),
          level('100', '0'),
          level('100', '2'),
        ],
        midPrice: '100',
      }),
      100,
      'long',
    );
    expect(result.estimatedSlippagePct).toBe(0);
  });
});
