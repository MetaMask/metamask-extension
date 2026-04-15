import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { PerpsToastProvider } from '../../components/app/perps';
import { usePerpsViewActive } from '../../hooks/perps/stream/usePerpsViewActive';
import { usePerpsStreamManager } from '../../hooks/perps/stream/usePerpsStreamManager';
import { usePerpsLifecycleBreadcrumbs } from '../../hooks/perps/usePerpsLifecycleBreadcrumbs';
import { submitRequestToBackground } from '../../store/background-connection';

const MIN_HIDDEN_DURATION_MS = 30_000;

/**
 * Layout wrapper for all Perps pages.
 *
 * This component is lazy-loaded via mmLazy in routes so that
 * the Perps dependency chain (PerpsStreamManager, etc.) is excluded from
 * the common bundle and only loaded when a user first navigates to a Perps route.
 *
 * It is the single point that gates background stream emission: mounting
 * signals the background to start forwarding WebSocket data to this connection,
 * and unmounting signals it to stop.
 */
export default function PerpsLayout() {
  usePerpsViewActive('PerpsLayout');
  usePerpsLifecycleBreadcrumbs();

  const { streamManager } = usePerpsStreamManager();

  // Nudge background perps WebSocket health when the tab becomes visible after
  // being hidden for a while. Offline→online is handled in PerpsStreamBridge.
  useEffect(() => {
    let hiddenAt: number | null = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }

      const wasHiddenAt = hiddenAt;
      hiddenAt = null;

      if (
        wasHiddenAt !== null &&
        Date.now() - wasHiddenAt < MIN_HIDDEN_DURATION_MS
      ) {
        return;
      }

      submitRequestToBackground('perpsCheckHealth').catch(() => {
        // fire-and-forget
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Keep all PerpsStreamManager channels connected for the lifetime of this
  // layout, even when no leaf UI subscribers exist. Without this, navigating
  // between Perps pages drops subscriber count to 0, disconnecting channels and
  // triggering a fresh REST fetch that can overwrite the cache with incomplete data.
  useEffect(() => {
    if (!streamManager) {
      return undefined;
    }

    streamManager.prewarm();

    return () => {
      streamManager.cleanupPrewarm();
    };
  }, [streamManager]);

  return (
    <PerpsToastProvider>
      <Outlet />
    </PerpsToastProvider>
  );
}
