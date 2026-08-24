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
  /** The Perps route stack, oldest entry first. */
  paths: string[];
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
 * When `lastVisitedPerpsRoute` is set, resumes the persisted perps stack when
 * all guards pass. Always clears the persisted entry so a later home mount
 * cannot replay it.
 *
 * Pushes every entry, not just the last, so back walks the screens the user came
 * through — no per-screen "my parent is X" rule for each new Perps route.
 *
 * Navigates directly rather than via `redirectAfterDefaultPage`: the
 * `pageChanged` reducer cancels that flag while the path is the default route,
 * which is where this hook runs.
 * @param options0
 * @param options0.lastVisitedPerpsRoute
 * @param options0.pendingRedirectRoute
 * @param options0.envType
 * @param options0.navigate
 * @param options0.clearLastVisitedPerpsRoute
 */
export function useLastVisitedPerpsRoute({
  lastVisitedPerpsRoute,
  pendingRedirectRoute,
  envType,
  navigate,
  clearLastVisitedPerpsRoute,
}: {
  lastVisitedPerpsRoute?: LastVisitedPerpsRoute | null;
  pendingRedirectRoute?: PendingRedirectRoute | null;
  envType?: string;
  navigate?: NavigateFunction;
  clearLastVisitedPerpsRoute?: () => void;
}) {
  // One resume per stack, so the dispatching effect below cannot repeat even if
  // a caller passes a new object identity every render.
  const resumedStackRef = useRef<string | null>(null);
  const stackKey = lastVisitedPerpsRoute?.paths?.join('\n') ?? null;
  const timestamp = lastVisitedPerpsRoute?.timestamp;
  const hasPendingRedirect = Boolean(pendingRedirectRoute);
  const pendingEnvironmentType = pendingRedirectRoute?.environmentType;

  useEffect(() => {
    if (!stackKey || timestamp === undefined) {
      return;
    }
    if (resumedStackRef.current === stackKey) {
      return;
    }
    resumedStackRef.current = stackKey;

    clearLastVisitedPerpsRoute?.();

    const paths = stackKey.split('\n');
    const isFresh = Date.now() - timestamp < PERPS_REOPEN_TTL_MS;
    const isPerpsStack = paths.every((path) => {
      const pathname = path.split(/[?#]/u)[0];
      return pathname === PERPS_ROUTE || pathname.startsWith(`${PERPS_ROUTE}/`);
    });
    const pendingApplies =
      hasPendingRedirect &&
      (!pendingEnvironmentType || pendingEnvironmentType === envType);
    const justLeftPerpsInApp = wasPerpsUnmountedInAppRecently(1500);

    if (!pendingApplies && !justLeftPerpsInApp && isFresh && isPerpsStack) {
      // Carried on every replayed entry so PerpsLayout can adopt this stack
      // whichever entry its first effect observes.
      paths.forEach((path) =>
        navigate?.(path, { state: { perpsResumedStack: paths } }),
      );
    }
  }, [
    stackKey,
    timestamp,
    hasPendingRedirect,
    pendingEnvironmentType,
    envType,
    navigate,
    clearLastVisitedPerpsRoute,
  ]);
}
