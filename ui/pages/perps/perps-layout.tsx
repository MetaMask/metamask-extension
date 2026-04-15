import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { PerpsToastProvider } from '../../components/app/perps';
import { usePerpsViewActive } from '../../hooks/perps/stream/usePerpsViewActive';
import { usePerpsReconnectOnFocus } from '../../hooks/perps/stream/usePerpsReconnectOnFocus';
import { usePerpsStreamManager } from '../../hooks/perps/stream/usePerpsStreamManager';
import { usePerpsLifecycleBreadcrumbs } from '../../hooks/perps/usePerpsLifecycleBreadcrumbs';

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
  usePerpsReconnectOnFocus();
  usePerpsLifecycleBreadcrumbs();

  const { streamManager } = usePerpsStreamManager();

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
