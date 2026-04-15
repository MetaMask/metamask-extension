import React from 'react';
import { Outlet } from 'react-router-dom';
import { PerpsToastProvider } from '../../components/app/perps';
import { usePerpsViewActive } from '../../hooks/perps/stream/usePerpsViewActive';
import { usePerpsReconnectOnFocus } from '../../hooks/perps/stream/usePerpsReconnectOnFocus';
import { usePerpsPrewarm } from '../../hooks/perps/stream/usePerpsPrewarm';
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
  usePerpsPrewarm();
  usePerpsLifecycleBreadcrumbs();

  return (
    <PerpsToastProvider>
      <Outlet />
    </PerpsToastProvider>
  );
}
