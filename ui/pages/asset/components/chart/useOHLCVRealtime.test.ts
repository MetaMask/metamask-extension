import { renderHook, act, waitFor } from '@testing-library/react';
import { useOHLCVRealtime } from './useOHLCVRealtime';

// ─── Mocks ──────────────────────────────────────────────────────────────────

type EventCallback = (data: unknown) => void;
type UnsubscribeFn = () => Promise<void>;

const mockEventSubscriptions = new Map<string, Set<EventCallback>>();
const mockUnsubscribeFns = new Map<string, Map<EventCallback, UnsubscribeFn>>();

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
  subscribeToMessengerEvent: jest.fn(
    (event: string, callback: EventCallback) => {
      if (!mockEventSubscriptions.has(event)) {
        mockEventSubscriptions.set(event, new Set());
        mockUnsubscribeFns.set(event, new Map());
      }
      const callbacks = mockEventSubscriptions.get(event) as Set<EventCallback>;
      callbacks.add(callback);

      const unsubscribe: UnsubscribeFn = jest.fn(async () => {
        mockEventSubscriptions.get(event)?.delete(callback);
        mockUnsubscribeFns.get(event)?.delete(callback);
      });
      const unsubFns = mockUnsubscribeFns.get(event) as Map<
        EventCallback,
        UnsubscribeFn
      >;
      unsubFns.set(callback, unsubscribe);

      return Promise.resolve(unsubscribe);
    },
  ),
}));

// Re-import mocked modules for assertion access
const { submitRequestToBackground, subscribeToMessengerEvent } =
  jest.requireMock('../../../../store/background-connection') as {
    submitRequestToBackground: jest.Mock;
    subscribeToMessengerEvent: jest.Mock;
  };

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_LATEST_BAR = {
  timestamp: 1700000000000, // milliseconds from REST API
  open: 1,
  high: 2,
  low: 0.5,
  close: 1.5,
  volume: 100,
};

const MOCK_WS_BAR = {
  timestamp: 1700000000, // seconds from WS
  open: 1,
  high: 2,
  low: 0.5,
  close: 1.5,
  volume: 100,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const mockFetchSuccess = (bar = MOCK_LATEST_BAR) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(bar),
  } as unknown as Response);
};

const mockFetchFailure = (status = 500) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    json: jest.fn(),
  } as unknown as Response);
};

/**
 * Simulate a messenger event being published from the background.
 * @param event
 * @param payload
 */
function emitMessengerEvent(event: string, payload: unknown) {
  const callbacks = mockEventSubscriptions.get(event);
  if (callbacks) {
    for (const cb of callbacks) {
      cb(payload);
    }
  }
}

/**
 * Flush all pending microtasks (promises) and advance fake timers.
 * @param ms
 */
async function advanceTimersAndFlush(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('useOHLCVRealtime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockEventSubscriptions.clear();
    mockUnsubscribeFns.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('initial state', () => {
    it('returns null latestBar initially', () => {
      mockFetchSuccess();

      const { result } = renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      expect(result.current.latestBar).toBeNull();
    });

    it('does not subscribe when disabled', async () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: false,
        }),
      );

      await advanceTimersAndFlush(1000);

      expect(subscribeToMessengerEvent).not.toHaveBeenCalled();
      expect(submitRequestToBackground).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not subscribe when assetId is empty', async () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: '',
          interval: '1h',
          enabled: true,
        }),
      );

      await advanceTimersAndFlush(1000);

      expect(subscribeToMessengerEvent).not.toHaveBeenCalled();
    });

    it('does not subscribe when interval is empty', async () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '',
          enabled: true,
        }),
      );

      await advanceTimersAndFlush(1000);

      expect(subscribeToMessengerEvent).not.toHaveBeenCalled();
    });
  });

  describe('WebSocket subscription', () => {
    it('subscribes to all three messenger events on mount', async () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      // Let event subscriptions resolve
      await advanceTimersAndFlush(0);

      expect(subscribeToMessengerEvent).toHaveBeenCalledWith(
        'OHLCVService:barUpdated',
        expect.any(Function),
      );
      expect(subscribeToMessengerEvent).toHaveBeenCalledWith(
        'OHLCVService:subscriptionError',
        expect.any(Function),
      );
      expect(subscribeToMessengerEvent).toHaveBeenCalledWith(
        'OHLCVService:chainStatusChanged',
        expect.any(Function),
      );
    });

    it('calls OHLCVService:subscribe after debounce', async () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      // Before debounce: no subscribe call
      expect(submitRequestToBackground).not.toHaveBeenCalledWith(
        'messengerCall',
        ['OHLCVService:subscribe', expect.anything()],
      );

      // Advance past debounce (500ms)
      await advanceTimersAndFlush(500);

      expect(submitRequestToBackground).toHaveBeenCalledWith('messengerCall', [
        'OHLCVService:subscribe',
        [{ assetId: 'ethereum', interval: '1h', currency: 'usd' }],
      ]);
    });

    it('updates latestBar when WS bar is received', async () => {
      mockFetchSuccess();

      const { result } = renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      await advanceTimersAndFlush(500);

      // Simulate WS bar event
      act(() => {
        emitMessengerEvent('OHLCVService:barUpdated', {
          channel: 'market-data.v1.ethereum.1h.usd',
          bar: MOCK_WS_BAR,
        });
      });

      await waitFor(() => {
        expect(result.current.latestBar).toEqual({
          time: MOCK_WS_BAR.timestamp * 1000,
          open: MOCK_WS_BAR.open,
          high: MOCK_WS_BAR.high,
          low: MOCK_WS_BAR.low,
          close: MOCK_WS_BAR.close,
          volume: MOCK_WS_BAR.volume,
        });
      });
    });

    it('unwraps array-wrapped payloads from messenger (production format)', async () => {
      mockFetchSuccess();

      const { result } = renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      await advanceTimersAndFlush(500);

      // In production, MessengerSubscriptions wraps event args in an array
      act(() => {
        emitMessengerEvent('OHLCVService:barUpdated', [
          {
            channel: 'market-data.v1.ethereum.1h.usd',
            bar: MOCK_WS_BAR,
          },
        ]);
      });

      await waitFor(() => {
        expect(result.current.latestBar).toEqual({
          time: MOCK_WS_BAR.timestamp * 1000,
          open: MOCK_WS_BAR.open,
          high: MOCK_WS_BAR.high,
          low: MOCK_WS_BAR.low,
          close: MOCK_WS_BAR.close,
          volume: MOCK_WS_BAR.volume,
        });
      });
    });

    it('ignores WS bars from different channels', async () => {
      mockFetchSuccess();

      const { result } = renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      await advanceTimersAndFlush(500);

      // Save the latestBar after initial REST poll
      const barAfterPoll = result.current.latestBar;

      // Simulate WS bar from a different channel
      act(() => {
        emitMessengerEvent('OHLCVService:barUpdated', {
          channel: 'market-data.v1.bitcoin.1d.eur',
          bar: { ...MOCK_WS_BAR, close: 99999 },
        });
      });

      // latestBar should not change
      expect(result.current.latestBar).toBe(barAfterPoll);
    });
  });

  describe('REST fallback', () => {
    it('polls REST /latest after debounce + subscribe for instant data', async () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      await advanceTimersAndFlush(500);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(calledUrl).toContain('/latest');
    });

    it('falls back to REST when staleness threshold is exceeded', async () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      // Initial subscribe + first REST poll
      await advanceTimersAndFlush(500);
      const initialFetchCount = (global.fetch as jest.Mock).mock.calls.length;

      // The staleness timer fires every 5s (started at t=0). The first check
      // at t=5000 sees only ~4.5s since the subscribe-time REST poll at t=500,
      // so it's not stale yet. Advance to t=10500 to reach the second check
      // at t=10000 where >5s have elapsed without a WS bar.
      await advanceTimersAndFlush(10000);

      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(
        initialFetchCount,
      );
    });

    it('handles array-wrapped subscription error from messenger', async () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      await advanceTimersAndFlush(0);

      const fetchCountBefore = (global.fetch as jest.Mock).mock.calls.length;

      // Production format: messenger wraps payload in an array
      act(() => {
        emitMessengerEvent('OHLCVService:subscriptionError', [
          {
            channel: 'market-data.v1.ethereum.1h.usd',
            error: 'Connection failed',
            operation: 'subscribe',
          },
        ]);
      });

      await advanceTimersAndFlush(0);

      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(
        fetchCountBefore,
      );
    });

    it('handles array-wrapped chain status from messenger', async () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: 'eip155:1/erc20:0xabc',
          interval: '1h',
          enabled: true,
        }),
      );

      await advanceTimersAndFlush(500);

      const fetchCountAfterSubscribe = (global.fetch as jest.Mock).mock.calls
        .length;

      // Production format: messenger wraps payload in an array
      act(() => {
        emitMessengerEvent('OHLCVService:chainStatusChanged', [
          {
            chainIds: ['eip155:1'],
            status: 'down',
          },
        ]);
      });

      await advanceTimersAndFlush(0);

      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(
        fetchCountAfterSubscribe,
      );
    });

    it('falls back to REST immediately on subscription error', async () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      // Let subscriptions register but don't advance past debounce yet
      await advanceTimersAndFlush(0);

      const fetchCountBefore = (global.fetch as jest.Mock).mock.calls.length;

      // Simulate subscription error
      act(() => {
        emitMessengerEvent('OHLCVService:subscriptionError', {
          channel: 'market-data.v1.ethereum.1h.usd',
          error: 'Connection failed',
          operation: 'subscribe',
        });
      });

      await advanceTimersAndFlush(0);

      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(
        fetchCountBefore,
      );
    });

    it('falls back to REST immediately on chain-down', async () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: 'eip155:1/erc20:0xabc',
          interval: '1h',
          enabled: true,
        }),
      );

      await advanceTimersAndFlush(500);

      const fetchCountAfterSubscribe = (global.fetch as jest.Mock).mock.calls
        .length;

      // Simulate chain-down
      act(() => {
        emitMessengerEvent('OHLCVService:chainStatusChanged', {
          chainIds: ['eip155:1'],
          status: 'down',
        });
      });

      await advanceTimersAndFlush(0);

      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(
        fetchCountAfterSubscribe,
      );
    });

    it('does not fallback on chain-down for a different chain', async () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: 'eip155:1/erc20:0xabc',
          interval: '1h',
          enabled: true,
        }),
      );

      await advanceTimersAndFlush(500);

      const fetchCountAfterSubscribe = (global.fetch as jest.Mock).mock.calls
        .length;

      // Simulate chain-down for a different chain
      act(() => {
        emitMessengerEvent('OHLCVService:chainStatusChanged', {
          chainIds: ['eip155:137'],
          status: 'down',
        });
      });

      await advanceTimersAndFlush(0);

      // No additional fetch should have been triggered
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(
        fetchCountAfterSubscribe,
      );
    });

    it('constructs URL correctly with all params', async () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '4h',
          currency: 'eur',
          enabled: true,
        }),
      );

      await advanceTimersAndFlush(500);

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      const url = new URL(calledUrl);

      expect(url.pathname).toContain('/ethereum/latest');
      expect(url.searchParams.get('timePeriod')).toBe('1m');
      expect(url.searchParams.get('interval')).toBe('4h');
      expect(url.searchParams.get('vsCurrency')).toBe('eur');
    });

    it('defaults vsCurrency to "usd"', async () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      await advanceTimersAndFlush(500);

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      const url = new URL(calledUrl);

      expect(url.searchParams.get('vsCurrency')).toBe('usd');
    });
  });

  describe('error handling', () => {
    it('handles fetch errors gracefully', async () => {
      mockFetchFailure(500);

      const { result } = renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      await advanceTimersAndFlush(500);

      // Should not throw, just return null
      expect(result.current.latestBar).toBeNull();
    });

    it('handles invalid bar data gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          timestamp: 'invalid',
          close: null,
        }),
      } as unknown as Response);

      const { result } = renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      await advanceTimersAndFlush(500);

      expect(result.current.latestBar).toBeNull();
    });

    it('handles null API response gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(null),
      } as unknown as Response);

      const { result } = renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      await advanceTimersAndFlush(500);

      expect(result.current.latestBar).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('unsubscribes from messenger events on unmount', async () => {
      mockFetchSuccess();

      const { unmount } = renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      // Let subscriptions register
      await advanceTimersAndFlush(0);

      expect(subscribeToMessengerEvent).toHaveBeenCalledTimes(3);

      unmount();

      // All event subscriptions should be cleaned up
      expect(
        mockEventSubscriptions.get('OHLCVService:barUpdated')?.size ?? 0,
      ).toBe(0);
      expect(
        mockEventSubscriptions.get('OHLCVService:subscriptionError')?.size ?? 0,
      ).toBe(0);
      expect(
        mockEventSubscriptions.get('OHLCVService:chainStatusChanged')?.size ??
          0,
      ).toBe(0);
    });

    it('calls OHLCVService:unsubscribe on unmount', async () => {
      mockFetchSuccess();

      const { unmount } = renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      await advanceTimersAndFlush(500);

      unmount();

      expect(submitRequestToBackground).toHaveBeenCalledWith('messengerCall', [
        'OHLCVService:unsubscribe',
        [{ assetId: 'ethereum', interval: '1h', currency: 'usd' }],
      ]);
    });

    it('clears timers on unmount', async () => {
      mockFetchSuccess();

      const { unmount } = renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      unmount();

      // After unmount, advancing timers should not trigger fetches
      await advanceTimersAndFlush(10000);

      expect(global.fetch).toHaveBeenCalledTimes(0);
    });

    it('aborts in-flight REST requests on unmount', async () => {
      let resolvePromise: () => void;
      const pendingPromise = new Promise<Response>((resolve) => {
        resolvePromise = () =>
          resolve({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue(MOCK_LATEST_BAR),
          } as unknown as Response);
      });

      global.fetch = jest.fn().mockReturnValue(pendingPromise);

      const { unmount } = renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      await advanceTimersAndFlush(500);

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Unmount while request is in flight
      unmount();

      // Resolve the promise
      await act(async () => {
        if (resolvePromise) {
          resolvePromise();
        }
      });

      // No error should occur (aborted request handled gracefully)
    });
  });

  describe('bar equality (pulse animation)', () => {
    it('always produces a new reference to drive the pulse animation', async () => {
      mockFetchSuccess();

      const { result } = renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      // Initial subscribe + REST poll
      await advanceTimersAndFlush(500);

      await waitFor(() => {
        expect(result.current.latestBar).not.toBeNull();
      });

      const initialBar = result.current.latestBar;

      // Simulate another WS bar with identical data
      act(() => {
        emitMessengerEvent('OHLCVService:barUpdated', {
          channel: 'market-data.v1.ethereum.1h.usd',
          bar: MOCK_WS_BAR,
        });
      });

      await waitFor(() => {
        // Reference should be different even though data is identical,
        // because the chart needs a REALTIME_UPDATE on every update
        // to show the pulse animation (intentionally differs from mobile).
        expect(result.current.latestBar).not.toBe(initialBar);
      });
    });

    it('updates state when bar data changes via WS', async () => {
      mockFetchSuccess();

      const { result } = renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      await advanceTimersAndFlush(500);

      await waitFor(() => {
        expect(result.current.latestBar).not.toBeNull();
      });

      const initialBar = result.current.latestBar;

      // Simulate WS bar with different close price
      act(() => {
        emitMessengerEvent('OHLCVService:barUpdated', {
          channel: 'market-data.v1.ethereum.1h.usd',
          bar: { ...MOCK_WS_BAR, close: 99.99 },
        });
      });

      await waitFor(() => {
        expect(result.current.latestBar?.close).toBe(99.99);
      });

      expect(result.current.latestBar).not.toBe(initialBar);
    });
  });

  describe('input changes', () => {
    it('resets latestBar when assetId changes', async () => {
      mockFetchSuccess();

      const { result, rerender } = renderHook(
        ({ assetId }) =>
          useOHLCVRealtime({
            assetId,
            interval: '1h',
            enabled: true,
          }),
        { initialProps: { assetId: 'ethereum' } },
      );

      await advanceTimersAndFlush(500);

      await waitFor(() => {
        expect(result.current.latestBar).not.toBeNull();
      });

      // Change assetId
      rerender({ assetId: 'bitcoin' });

      // latestBar should be reset to null
      expect(result.current.latestBar).toBeNull();
    });

    it('resets latestBar when interval changes', async () => {
      mockFetchSuccess();

      const { result, rerender } = renderHook(
        ({ interval }) =>
          useOHLCVRealtime({
            assetId: 'ethereum',
            interval,
            enabled: true,
          }),
        { initialProps: { interval: '1h' } },
      );

      await advanceTimersAndFlush(500);

      await waitFor(() => {
        expect(result.current.latestBar).not.toBeNull();
      });

      // Change interval
      rerender({ interval: '4h' });

      // latestBar should be reset to null
      expect(result.current.latestBar).toBeNull();
    });

    it('re-subscribes when assetId changes', async () => {
      mockFetchSuccess();

      const { rerender } = renderHook(
        ({ assetId }) =>
          useOHLCVRealtime({
            assetId,
            interval: '1h',
            enabled: true,
          }),
        { initialProps: { assetId: 'ethereum' } },
      );

      await advanceTimersAndFlush(500);

      // First subscribe
      expect(submitRequestToBackground).toHaveBeenCalledWith('messengerCall', [
        'OHLCVService:subscribe',
        [{ assetId: 'ethereum', interval: '1h', currency: 'usd' }],
      ]);

      // Change assetId — triggers cleanup (unsubscribe) and new subscription
      rerender({ assetId: 'bitcoin' });

      // Unsubscribe from old
      expect(submitRequestToBackground).toHaveBeenCalledWith('messengerCall', [
        'OHLCVService:unsubscribe',
        [{ assetId: 'ethereum', interval: '1h', currency: 'usd' }],
      ]);

      // Advance past debounce for new subscription
      await advanceTimersAndFlush(500);

      // Subscribe to new
      expect(submitRequestToBackground).toHaveBeenCalledWith('messengerCall', [
        'OHLCVService:subscribe',
        [{ assetId: 'bitcoin', interval: '1h', currency: 'usd' }],
      ]);
    });
  });

  describe('debounce behavior', () => {
    it('does not call subscribe before debounce period', async () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      // Advance 400ms (less than 500ms debounce)
      await advanceTimersAndFlush(400);

      // Should NOT have called subscribe yet
      expect(submitRequestToBackground).not.toHaveBeenCalledWith(
        'messengerCall',
        ['OHLCVService:subscribe', expect.anything()],
      );

      // Advance remaining 100ms
      await advanceTimersAndFlush(100);

      // NOW it should have called subscribe
      expect(submitRequestToBackground).toHaveBeenCalledWith('messengerCall', [
        'OHLCVService:subscribe',
        [{ assetId: 'ethereum', interval: '1h', currency: 'usd' }],
      ]);
    });
  });
});
