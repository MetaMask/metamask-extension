import { renderHook, act, waitFor } from '@testing-library/react';
import { useOHLCVRealtime } from './useOHLCVRealtime';

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_LATEST_BAR = {
  timestamp: 1700000000000, // milliseconds
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

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('useOHLCVRealtime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
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

    it('does not fetch when disabled', () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: false,
        }),
      );

      // Advance past debounce
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not fetch when assetId is empty', () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: '',
          interval: '1h',
          enabled: true,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not fetch when interval is empty', () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '',
          enabled: true,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('polling behavior', () => {
    it('fetches latest bar after debounce period', async () => {
      mockFetchSuccess();

      const { result } = renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      // Advance past debounce (500ms)
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('/latest');

      // Wait for state update
      await waitFor(() => {
        expect(result.current.latestBar).toEqual({
          time: MOCK_LATEST_BAR.timestamp,
          open: MOCK_LATEST_BAR.open,
          high: MOCK_LATEST_BAR.high,
          low: MOCK_LATEST_BAR.low,
          close: MOCK_LATEST_BAR.close,
          volume: MOCK_LATEST_BAR.volume,
        });
      });
    });

    it('polls periodically after initial fetch', async () => {
      mockFetchSuccess();

      renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      // Initial fetch after debounce
      await act(async () => {
        jest.advanceTimersByTime(500);
      });
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Advance 5 seconds (poll interval)
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Advance another 5 seconds
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
      expect(global.fetch).toHaveBeenCalledTimes(3);
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

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      const url = new URL(calledUrl);

      expect(url.pathname).toContain('/ethereum/latest');
      expect(url.searchParams.get('timePeriod')).toBe('1m'); // 4h → 1m
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

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

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

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

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

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

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

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.latestBar).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('clears timers on unmount', () => {
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
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Only the initial debounce timer might have started, but no fetches
      // should occur after unmount
      expect(global.fetch).toHaveBeenCalledTimes(0);
    });

    it('aborts in-flight requests on unmount', async () => {
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

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

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

  describe('bar equality', () => {
    it('does not update state when bar data is identical', async () => {
      mockFetchSuccess();

      const { result } = renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      // Initial fetch
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      const initialBar = result.current.latestBar;

      // Second poll with same data
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      // Reference should be the same (no re-render)
      expect(result.current.latestBar).toBe(initialBar);
    });

    it('updates state when bar data changes', async () => {
      mockFetchSuccess();

      const { result } = renderHook(() =>
        useOHLCVRealtime({
          assetId: 'ethereum',
          interval: '1h',
          enabled: true,
        }),
      );

      // Initial fetch
      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      const initialBar = result.current.latestBar;

      // Change the mock to return different data
      const newBar = { ...MOCK_LATEST_BAR, close: 2.0 };
      mockFetchSuccess(newBar);

      // Second poll with different data
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(result.current.latestBar?.close).toBe(2.0);
      });

      // Reference should be different
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

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

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

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.latestBar).not.toBeNull();
      });

      // Change interval
      rerender({ interval: '4h' });

      // latestBar should be reset to null
      expect(result.current.latestBar).toBeNull();
    });
  });
});
