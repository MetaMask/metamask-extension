import React, { useEffect, type ReactNode } from 'react';
import { PerpsControllerProvider } from '../../providers/perps';
import { submitRequestToBackground } from '../../store/background-connection';

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
 *
 * It is also the single point that gates background stream emission: mounting
 * signals the background to start forwarding WebSocket data to this connection,
 * and unmounting signals it to stop.
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

  return <PerpsControllerProvider>{children}</PerpsControllerProvider>;
}
