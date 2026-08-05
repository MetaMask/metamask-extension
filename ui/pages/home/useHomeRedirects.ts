import { useEffect } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { wasPerpsUnmountedInAppRecently } from '../../helpers/perps/in-app-leave-marker';
import {
  PERPS_ROUTE,
  PERPS_REOPEN_TTL_MS,
} from '../../helpers/constants/routes';

export type PendingRedirectRoute = {
  path: string;
  search?: string;
  environmentType?: string;
};

export type RedirectAfterDefaultPage = {
  shouldRedirect?: boolean;
  path?: string;
};

export type LastVisitedPerpsRoute = {
  path: string;
  timestamp: number;
};

/**
 * Navigates immediately when `redirectAfterDefaultPage` is set and cleared in
 * the same tick — e.g. after a pending deeplink or perps-resume is resolved.
 * @param options0
 * @param options0.redirectAfterDefaultPage
 * @param options0.navigate
 * @param options0.clearRedirectAfterDefaultPage
 */
export function useRedirectAfterDefaultPage({
  redirectAfterDefaultPage,
  navigate,
  clearRedirectAfterDefaultPage,
}: {
  redirectAfterDefaultPage?: RedirectAfterDefaultPage;
  navigate?: NavigateFunction;
  clearRedirectAfterDefaultPage?: () => void;
}) {
  useEffect(() => {
    if (
      redirectAfterDefaultPage?.shouldRedirect &&
      redirectAfterDefaultPage.path
    ) {
      const { path } = redirectAfterDefaultPage;
      clearRedirectAfterDefaultPage?.();
      navigate?.(path);
    }
  }, [redirectAfterDefaultPage, navigate, clearRedirectAfterDefaultPage]);
}

/**
 * When `pendingRedirectRoute` is set, evaluates whether the route applies to the
 * current environment and, if so, schedules a redirect via
 * `setRedirectAfterDefaultPage`. Always clears the pending entry so StrictMode
 * remounts cannot replay the same redirect.
 * @param options0
 * @param options0.pendingRedirectRoute
 * @param options0.envType
 * @param options0.setRedirectAfterDefaultPage
 * @param options0.clearPendingRedirectRoute
 */
export function usePendingRedirectRoute({
  pendingRedirectRoute,
  envType,
  setRedirectAfterDefaultPage,
  clearPendingRedirectRoute,
}: {
  pendingRedirectRoute?: PendingRedirectRoute | null;
  envType?: string;
  setRedirectAfterDefaultPage?: (redirect: { path: string }) => void;
  clearPendingRedirectRoute?: () => void;
}) {
  useEffect(() => {
    if (!pendingRedirectRoute) {
      return;
    }

    const { path, search, environmentType } = pendingRedirectRoute;
    clearPendingRedirectRoute?.();

    const shouldRedirect = !environmentType || environmentType === envType;
    if (shouldRedirect) {
      setRedirectAfterDefaultPage?.({
        path: search ? `${path}${search}` : path,
      });
    }
  }, [
    pendingRedirectRoute,
    envType,
    setRedirectAfterDefaultPage,
    clearPendingRedirectRoute,
  ]);
}

/**
 * When `lastVisitedPerpsRoute` is set, resumes the persisted perps path when all
 * guards pass. Always clears the persisted entry so StrictMode remounts cannot
 * replay it.
 * @param options0
 * @param options0.lastVisitedPerpsRoute
 * @param options0.pendingRedirectRoute
 * @param options0.envType
 * @param options0.setRedirectAfterDefaultPage
 * @param options0.clearLastVisitedPerpsRoute
 */
export function useLastVisitedPerpsRoute({
  lastVisitedPerpsRoute,
  pendingRedirectRoute,
  envType,
  setRedirectAfterDefaultPage,
  clearLastVisitedPerpsRoute,
}: {
  lastVisitedPerpsRoute?: LastVisitedPerpsRoute | null;
  pendingRedirectRoute?: PendingRedirectRoute | null;
  envType?: string;
  setRedirectAfterDefaultPage?: (redirect: { path: string }) => void;
  clearLastVisitedPerpsRoute?: () => void;
}) {
  useEffect(() => {
    if (!lastVisitedPerpsRoute) {
      return;
    }

    const { path, timestamp } = lastVisitedPerpsRoute;
    clearLastVisitedPerpsRoute?.();

    const isFresh = Date.now() - timestamp < PERPS_REOPEN_TTL_MS;
    const pathname = typeof path === 'string' ? path.split(/[?#]/u)[0] : '';
    const isPerpsPath =
      pathname === PERPS_ROUTE || pathname.startsWith(`${PERPS_ROUTE}/`);
    const pendingApplies =
      Boolean(pendingRedirectRoute) &&
      (!pendingRedirectRoute?.environmentType ||
        pendingRedirectRoute?.environmentType === envType);
    const justLeftPerpsInApp = wasPerpsUnmountedInAppRecently(1500);

    if (!pendingApplies && !justLeftPerpsInApp && isFresh && isPerpsPath) {
      setRedirectAfterDefaultPage?.({ path });
    }
  }, [
    lastVisitedPerpsRoute,
    pendingRedirectRoute,
    envType,
    setRedirectAfterDefaultPage,
    clearLastVisitedPerpsRoute,
  ]);
}
