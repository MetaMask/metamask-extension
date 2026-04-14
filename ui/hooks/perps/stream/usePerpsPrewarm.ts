import { useEffect } from 'react';
import { usePerpsStreamManager } from './usePerpsStreamManager';

/**
 * Keep all PerpsStreamManager channels connected for the lifetime of
 * the calling component, even when no leaf UI subscribers exist.
 *
 * Without this, navigating between Perps pages (market list → detail → back)
 * causes the subscriber count to drop to 0, disconnecting the channel and
 * triggering a fresh REST fetch on the next subscribe. If that fetch returns
 * incomplete data (e.g., HIP-3 DEX API timeout), the cache is overwritten
 * with degraded data and prices disappear.
 *
 * Mount once in PerpsLayout so all child routes benefit.
 */
export function usePerpsPrewarm(): void {
  const { streamManager } = usePerpsStreamManager();

  useEffect(() => {
    if (!streamManager) {
      return undefined;
    }

    streamManager.prewarm();

    return () => {
      streamManager.cleanupPrewarm();
    };
  }, [streamManager]);
}
