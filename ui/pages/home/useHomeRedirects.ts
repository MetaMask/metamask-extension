import { useEffect, useRef } from 'react';
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
      navigate?.(redirectAfterDefaultPage.path);
      clearRedirectAfterDefaultPage?.();
    }
  }, [redirectAfterDefaultPage, navigate, clearRedirectAfterDefaultPage]);
}

/**
 * On mount (or when `pendingRedirectRoute` transitions from null/undefined to a
 * value), evaluates whether the route applies to the current environment and, if
 * so, schedules a redirect via `setRedirectAfterDefaultPage`. Always clears the
 * pending entry afterwards so it cannot fire again.
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
  const prevRef = useRef<PendingRedirectRoute | null | undefined>(undefined);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = pendingRedirectRoute;

    // Fire on mount (undefined → value) or on null → non-null transitions.
    if (pendingRedirectRoute && (prev === undefined || prev === null)) {
      const { path, search, environmentType } = pendingRedirectRoute;
      const shouldRedirect = !environmentType || environmentType === envType;
      if (shouldRedirect) {
        setRedirectAfterDefaultPage?.({
          path: search ? `${path}${search}` : path,
        });
      }
      clearPendingRedirectRoute?.();
    }
  }, [
    pendingRedirectRoute,
    envType,
    setRedirectAfterDefaultPage,
    clearPendingRedirectRoute,
  ]);
}

/**
 * On mount (or when `lastVisitedPerpsRoute` transitions from null/undefined to a
 * value), resumes the persisted perps path when all of the following hold:
 * - the entry is still within `PERPS_REOPEN_TTL_MS`
 * - the path is genuinely a `/perps` or `/perps/…` route
 * - no higher-priority `pendingRedirectRoute` applies to this environment
 * - the user did not just leave perps in-app (prevents replaying on same session)
 *
 * Always clears the persisted entry afterwards so a later home mount cannot
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
  const prevRef = useRef<LastVisitedPerpsRoute | null | undefined>(undefined);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = lastVisitedPerpsRoute;

    if (lastVisitedPerpsRoute && (prev === undefined || prev === null)) {
      const { path, timestamp } = lastVisitedPerpsRoute;
      const isFresh = Date.now() - timestamp < PERPS_REOPEN_TTL_MS;
      // Exact match on `/perps` or a `/perps/...` sub-route only. Prevents a
      // future sibling like `/perpsNew` from silently resuming off a stale
      // persisted path. Strip any query/hash suffix first so a stored path
      // like `/perps?tab=1` still matches.
      const pathname = typeof path === 'string' ? path.split(/[?#]/u)[0] : '';
      const isPerpsPath =
        pathname === PERPS_ROUTE || pathname.startsWith(`${PERPS_ROUTE}/`);
      // An in-app departure from `/perps/*` scheduled a Redux clear in the
      // passive-effect phase — React fires this `componentDidMount` first, so
      // the clear hasn't landed yet. The module-level marker tells us this is
      // an in-app transition (not a popup reopen) and we must not replay the
      // redirect. A fresh JS context (popup close→reopen) starts with an
      // unset marker, so the real resume path still fires.
      // `pendingRedirectRoute` is a higher-priority cross-session redirect
      // (e.g. a background-initiated deeplink); skip the perps resume when
      // one will actually fire in this environment. Mirror the
      // `checkPendingRedirectRoute` env applicability check so an
      // environment-mismatched pending entry (still non-null because the
      // clear is async) does not suppress the perps resume. Always clear
      // the persisted entry afterwards so a later home mount cannot replay
      // it.
      const pendingApplies =
        Boolean(pendingRedirectRoute) &&
        (!pendingRedirectRoute?.environmentType ||
          pendingRedirectRoute?.environmentType === envType);
      const justLeftPerpsInApp = wasPerpsUnmountedInAppRecently(1500);

      if (!pendingApplies && !justLeftPerpsInApp && isFresh && isPerpsPath) {
        setRedirectAfterDefaultPage?.({ path });
      }
      clearLastVisitedPerpsRoute?.();
    }
  }, [
    lastVisitedPerpsRoute,
    pendingRedirectRoute,
    envType,
    setRedirectAfterDefaultPage,
    clearLastVisitedPerpsRoute,
  ]);
}
