import { renderHook, act } from '@testing-library/react';
import { useWatchlist } from './useWatchlist';

describe('useWatchlist', () => {
  const STORAGE_KEY = 'perps-watchlist';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('initializes with empty watchlist when localStorage is empty', () => {
      const { result } = renderHook(() => useWatchlist());

      expect(result.current.watchlist).toEqual([]);
      expect(result.current.isEmpty).toBe(true);
    });

    it('initializes with watchlist from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['BTC', 'ETH']));

      const { result } = renderHook(() => useWatchlist());

      expect(result.current.watchlist).toEqual(['BTC', 'ETH']);
      expect(result.current.isEmpty).toBe(false);
    });

    it('handles invalid JSON in localStorage gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json');

      const { result } = renderHook(() => useWatchlist());

      expect(result.current.watchlist).toEqual([]);
    });
  });

  describe('addToWatchlist', () => {
    it('adds a symbol to the watchlist', () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.addToWatchlist('BTC');
      });

      expect(result.current.watchlist).toContain('BTC');
      expect(result.current.isEmpty).toBe(false);
    });

    it('does not add duplicate symbols', () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.addToWatchlist('BTC');
        result.current.addToWatchlist('BTC');
      });

      expect(result.current.watchlist).toEqual(['BTC']);
    });

    it('persists to localStorage', () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.addToWatchlist('ETH');
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      expect(stored).toContain('ETH');
    });
  });

  describe('removeFromWatchlist', () => {
    it('removes a symbol from the watchlist', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['BTC', 'ETH']));
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.removeFromWatchlist('BTC');
      });

      expect(result.current.watchlist).toEqual(['ETH']);
    });

    it('does nothing if symbol is not in watchlist', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['BTC']));
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.removeFromWatchlist('ETH');
      });

      expect(result.current.watchlist).toEqual(['BTC']);
    });

    it('persists removal to localStorage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['BTC', 'ETH']));
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.removeFromWatchlist('BTC');
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      expect(stored).toEqual(['ETH']);
    });
  });

  describe('toggleWatchlist', () => {
    it('adds symbol if not in watchlist', () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.toggleWatchlist('BTC');
      });

      expect(result.current.watchlist).toContain('BTC');
    });

    it('removes symbol if already in watchlist', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['BTC']));
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.toggleWatchlist('BTC');
      });

      expect(result.current.watchlist).not.toContain('BTC');
    });
  });

  describe('isInWatchlist', () => {
    it('returns true for symbols in watchlist', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['BTC', 'ETH']));
      const { result } = renderHook(() => useWatchlist());

      expect(result.current.isInWatchlist('BTC')).toBe(true);
      expect(result.current.isInWatchlist('ETH')).toBe(true);
    });

    it('returns false for symbols not in watchlist', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['BTC']));
      const { result } = renderHook(() => useWatchlist());

      expect(result.current.isInWatchlist('SOL')).toBe(false);
    });
  });

  describe('clearWatchlist', () => {
    it('clears the entire watchlist', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['BTC', 'ETH', 'SOL']));
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.clearWatchlist();
      });

      expect(result.current.watchlist).toEqual([]);
      expect(result.current.isEmpty).toBe(true);
    });

    it('persists clear to localStorage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['BTC']));
      const { result } = renderHook(() => useWatchlist());

      act(() => {
        result.current.clearWatchlist();
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '["error"]');
      expect(stored).toEqual([]);
    });
  });

  describe('isEmpty', () => {
    it('returns true when watchlist is empty', () => {
      const { result } = renderHook(() => useWatchlist());

      expect(result.current.isEmpty).toBe(true);
    });

    it('returns false when watchlist has items', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['BTC']));
      const { result } = renderHook(() => useWatchlist());

      expect(result.current.isEmpty).toBe(false);
    });
  });
});
