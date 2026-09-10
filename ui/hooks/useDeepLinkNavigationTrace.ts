import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { matchPath, useLocation } from 'react-router-dom';
import log from 'loglevel';
import {
  getCurrentTabId,
  getPendingDeepLinkNavigation,
  removePendingDeepLinkNavigation,
  type PendingDeepLinkNavigation,
} from '../../shared/lib/deep-links/performance';
import {
  endTrace,
  getPerformanceTimestamp,
  trace,
  TraceName,
  TraceOperation,
} from '../../shared/lib/trace';
import { getIsUnlocked } from '../ducks/metamask/base-selectors';
import {
  BASIC_FUNCTIONALITY_OFF_ROUTE,
  DEEP_LINK_ROUTE,
  LOCK_ROUTE,
  ONBOARDING_ROUTE,
  ROUTES,
  UNLOCK_ROUTE,
} from '../helpers/constants/routes';

const NAVIGATION_TRACE_TIMEOUT = 5 * 60 * 1000;

type ActiveNavigationTrace = {
  id: string;
  tabId: number;
  targetRoute: string;
  timeout: ReturnType<typeof setTimeout>;
};

let activeNavigationTrace: ActiveNavigationTrace | null = null;
let pendingUnlockStart: Promise<string | null> | null = null;

function removeRecord(tabId: number, id: string): void {
  removePendingDeepLinkNavigation(tabId, id).catch((error) => {
    log.error('Failed to remove pending deep link navigation:', error);
  });
}

function endActiveNavigationTrace(
  id: string,
  data: Record<string, number | string | boolean>,
  { remove = true }: { remove?: boolean } = {},
): void {
  if (activeNavigationTrace?.id !== id) {
    return;
  }

  const current = activeNavigationTrace;
  activeNavigationTrace = null;
  clearTimeout(current.timeout);
  endTrace({
    name: TraceName.DeeplinkNavigated,
    id,
    data,
  });

  if (remove) {
    removeRecord(current.tabId, id);
  }
}

function startNavigationTrace(
  record: PendingDeepLinkNavigation,
  tabId: number,
  startSource: 'intake' | 'unlock',
  startTime: number,
): string | null {
  if (activeNavigationTrace) {
    if (activeNavigationTrace.id === record.id) {
      return activeNavigationTrace.id;
    }

    endActiveNavigationTrace(activeNavigationTrace.id, {
      success: false,
      reason: 'unresolved',
    });
  }

  trace({
    name: TraceName.DeeplinkNavigated,
    id: record.id,
    op: TraceOperation.DeeplinkPerformance,
    startTime,
    // Matches `deeplink_activation_id` on the background `Deeplink Processed`
    // span, which is where this record's id originates. See the comment there.
    data: {
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
      deeplink_activation_id: record.id,
    },
    tags: {
      ...record.urlTags,
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
      start_source: startSource,
    },
  });

  const timeout = setTimeout(() => {
    endActiveNavigationTrace(record.id, {
      success: false,
      reason: 'timed_out',
    });
  }, NAVIGATION_TRACE_TIMEOUT);

  activeNavigationTrace = {
    id: record.id,
    tabId,
    targetRoute: record.targetRoute,
    timeout,
  };
  return record.id;
}

export function startPendingDeepLinkUnlockTrace(): Promise<string | null> {
  const submitTimestamp = getPerformanceTimestamp();
  const startPromise = (async () => {
    try {
      const tabId = await getCurrentTabId();
      if (tabId === null) {
        return null;
      }

      const record = await getPendingDeepLinkNavigation(tabId);
      if (!record) {
        return null;
      }

      return startNavigationTrace(record, tabId, 'unlock', submitTimestamp);
    } catch (error) {
      log.error('Failed to start pending deep link unlock trace:', error);
      return null;
    }
  })();

  pendingUnlockStart = startPromise;
  startPromise.finally(() => {
    if (pendingUnlockStart === startPromise) {
      pendingUnlockStart = null;
    }
  });
  return startPromise;
}

export function cancelPendingDeepLinkUnlockTrace(
  id: string | null,
  reason: 'unlock_failed',
): void {
  if (!id) {
    return;
  }
  endActiveNavigationTrace(
    id,
    {
      success: false,
      reason,
    },
    { remove: false },
  );
}

function isWaitingRoute(pathname: string): boolean {
  return (
    pathname === DEEP_LINK_ROUTE ||
    pathname === UNLOCK_ROUTE ||
    pathname === LOCK_ROUTE ||
    pathname === ONBOARDING_ROUTE ||
    pathname.startsWith(`${ONBOARDING_ROUTE}/`)
  );
}

function getFocusedRoute(pathname: string): string {
  return (
    ROUTES.find(({ path }) => matchPath({ path, end: true }, pathname))?.path ??
    'unknown'
  );
}

export function useDeepLinkNavigationTrace(): void {
  const { pathname } = useLocation();
  const isUnlocked = useSelector(getIsUnlocked);

  useEffect(() => {
    let disposed = false;
    let completionTimer: ReturnType<typeof setTimeout> | undefined;

    const observeNavigation = async () => {
      try {
        const tabId = await getCurrentTabId();
        if (tabId === null) {
          return;
        }

        const record = await getPendingDeepLinkNavigation(tabId);
        if (!record || disposed) {
          return;
        }

        if (pendingUnlockStart) {
          await pendingUnlockStart;
        }

        if (disposed || !isUnlocked || isWaitingRoute(pathname)) {
          return;
        }

        if (pathname === BASIC_FUNCTIONALITY_OFF_ROUTE) {
          const id = startNavigationTrace(
            record,
            tabId,
            'intake',
            record.intakeTimestamp,
          );
          if (id) {
            endActiveNavigationTrace(id, {
              success: false,
              reason: 'basic_functionality',
            });
          }
          return;
        }

        const id = startNavigationTrace(
          record,
          tabId,
          'intake',
          record.intakeTimestamp,
        );
        if (!id) {
          return;
        }

        const focusedRoute = getFocusedRoute(pathname);
        completionTimer = setTimeout(() => {
          if (!disposed) {
            endActiveNavigationTrace(id, {
              success: true,
              // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
              nav_target: 'inferred',
              // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
              target_route: record.targetRoute,
              // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
              focused_route: focusedRoute,
            });
          }
        }, 0);
      } catch (error) {
        log.error('Failed to observe pending deep link navigation:', error);
      }
    };

    observeNavigation();

    return () => {
      disposed = true;
      if (completionTimer) {
        clearTimeout(completionTimer);
      }
    };
  }, [isUnlocked, pathname]);
}
