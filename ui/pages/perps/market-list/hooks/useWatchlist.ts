import { useState, useCallback, useEffect } from 'react';

const WATCHLIST_STORAGE_KEY = 'perps-watchlist';

/**
 * Custom hook for managing the perps market watchlist
 *
 * Persists the watchlist to localStorage and provides methods to
 * add, remove, toggle, and check if symbols are in the watchlist.
 *
 * @returns Watchlist state and management functions
 */
export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage when watchlist changes
  useEffect(() => {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [watchlist]);

  /**
   * Add a symbol to the watchlist
   */
  const addToWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      if (prev.includes(symbol)) {
        return prev;
      }
      return [...prev, symbol];
    });
  }, []);

  /**
   * Remove a symbol from the watchlist
   */
  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => prev.filter((s) => s !== symbol));
  }, []);

  /**
   * Toggle a symbol in the watchlist (add if not present, remove if present)
   */
  const toggleWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      if (prev.includes(symbol)) {
        return prev.filter((s) => s !== symbol);
      }
      return [...prev, symbol];
    });
  }, []);

  /**
   * Check if a symbol is in the watchlist
   */
  const isInWatchlist = useCallback(
    (symbol: string) => watchlist.includes(symbol),
    [watchlist],
  );

  /**
   * Clear the entire watchlist
   */
  const clearWatchlist = useCallback(() => {
    setWatchlist([]);
  }, []);

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isInWatchlist,
    clearWatchlist,
    isEmpty: watchlist.length === 0,
  };
};

export default useWatchlist;
