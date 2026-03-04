import React, { type ReactNode } from 'react';
import { PerpsControllerProvider } from '../../providers/perps';

type PerpsLayoutProps = {
  children: ReactNode;
};

/**
 * Layout wrapper for all Perps pages.
 *
 * This component is lazy-loaded via mmLazy in routes so that
 * PerpsControllerProvider and its dependency chain (PerpsStreamManager,
 * createPerpsControllerFacade, etc.) are excluded from the common bundle and
 * only loaded when a user first navigates to a Perps route.
 */
export default function PerpsLayout({ children }: PerpsLayoutProps) {
  return <PerpsControllerProvider>{children}</PerpsControllerProvider>;
}
