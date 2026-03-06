import React, { useEffect, type ReactNode } from 'react';
import { PerpsToastProvider } from '../../components/app/perps';
import { submitRequestToBackground } from '../../store/background-connection';

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
  useEffect(() => {
    submitRequestToBackground('perpsViewActive', [true]).catch((err) => {
      // Background not ready yet — stream will activate once perpsInit completes
      console.debug('[PerpsLayout] perpsViewActive(true) failed:', err);
    });
    return () => {
      submitRequestToBackground('perpsViewActive', [false]).catch((err) => {
        // Expected when the port closes before unmount (popup teardown).
        console.debug('[PerpsLayout] perpsViewActive(false) failed:', err);
      });
    };
  }, []);

  return <PerpsToastProvider>{children}</PerpsToastProvider>;
}
