import { useEffect } from 'react';

/**
 * Adds Sentry breadcrumbs for Perps popup lifecycle events.
 *
 * Tracks when the extension popup is hidden (closed by the user or another window
 * is focused) while Perps is active. These breadcrumbs appear in Sentry event
 * detail views and help diagnose errors caused by partial operations that were
 * interrupted by popup close.
 *
 * Uses `visibilitychange` (reliable in the extension popup) as the primary
 * mechanism. The `beforeunload` event fires just before teardown and records
 * the popup close itself.
 */
export function usePerpsLifecycleBreadcrumbs(): void {
  useEffect(() => {
    globalThis.sentry?.addBreadcrumb?.({
      category: 'perps.lifecycle',
      message: 'Perps popup opened',
      level: 'info',
    });

    const handleVisibilityChange = () => {
      if (document.hidden) {
        globalThis.sentry?.addBreadcrumb?.({
          category: 'perps.lifecycle',
          message: 'Perps popup hidden',
          level: 'info',
          data: { visibilityState: document.visibilityState },
        });
      } else {
        globalThis.sentry?.addBreadcrumb?.({
          category: 'perps.lifecycle',
          message: 'Perps popup visible',
          level: 'info',
        });
      }
    };

    const handleBeforeUnload = () => {
      globalThis.sentry?.addBreadcrumb?.({
        category: 'perps.lifecycle',
        message: 'Perps popup closing',
        level: 'info',
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}
