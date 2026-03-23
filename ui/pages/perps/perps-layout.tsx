import React, { type ReactNode } from 'react';
import { usePerpsViewActive } from '../../hooks/perps/stream/usePerpsViewActive';

type PerpsLayoutProps = {
  children: ReactNode;
};

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
 *
 * @param options0 - Component props
 * @param options0.children - Child elements to render inside the layout
 */
export default function PerpsLayout({ children }: PerpsLayoutProps) {
  usePerpsViewActive('PerpsLayout');

  return <>{children}</>;
}
