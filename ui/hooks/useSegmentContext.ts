import { useCallback, useContext, useMemo } from 'react';
import { useSelector, useStore } from 'react-redux';
import {
  useLocation,
  matchPath,
  UNSAFE_DataRouterContext as DataRouterContext,
  UNSAFE_NavigationContext as NavigationContext,
} from 'react-router-dom';
import {
  MetaMetricsPageObject,
  MetaMetricsReferrerObject,
} from '../../shared/constants/metametrics';
import {
  PATH_NAME_MAP,
  getPaths,
  type AppRoutes,
} from '../helpers/constants/routes';
import { txDataSelector } from '../selectors';

/**
 * The return type of useSegmentContext hook
 */
export type SegmentContext = {
  page?: MetaMetricsPageObject;
  referrer?: MetaMetricsReferrerObject;
};

/**
 * Finds the first matching path from our route map for the given pathname.
 *
 * @param pathname - The current location pathname
 * @returns The matched path or undefined if no match
 */
function findMatchingPath(pathname: string): AppRoutes['path'] | undefined {
  const paths = getPaths();
  for (const path of paths) {
    const match = matchPath(
      { path, end: true, caseSensitive: false },
      pathname,
    );
    if (match) {
      return path;
    }
  }
  return undefined;
}

/**
 * Returns the current page if it matches our route map, as well as the origin
 * if there is a confirmation that was triggered by a dapp. These values are
 * not required but add valuable context to events, and should be included in
 * the context object on the event payload.
 *
 * @returns The current page and referrer context for MetaMetrics events
 */
export function useSegmentContext(): SegmentContext {
  const location = useLocation();

  const matchedPath = findMatchingPath(location.pathname);
  const matchedTitle = matchedPath ? PATH_NAME_MAP.get(matchedPath) : undefined;

  const txData = useSelector(txDataSelector) ?? {};
  const confirmTransactionOrigin = txData.origin as string | undefined;

  const referrer = useMemo<MetaMetricsReferrerObject | undefined>(
    () =>
      confirmTransactionOrigin
        ? {
            url: confirmTransactionOrigin,
          }
        : undefined,
    [confirmTransactionOrigin],
  );

  const page = useMemo<MetaMetricsPageObject | undefined>(
    () =>
      matchedPath
        ? {
            path: matchedPath,
            title: matchedTitle,
            url: matchedPath,
          }
        : undefined,
    [matchedPath, matchedTitle],
  );

  return useMemo(() => ({ page, referrer }), [page, referrer]);
}

/**
 * Returns a stable function that reads the same context as `useSegmentContext`
 * at call time, instead of subscribing the calling component to the router
 * location and the transaction data.
 *
 * Prefer this in hooks that only need the context when an event is sent, so
 * that navigating does not re-render every component that can track events.
 *
 * @returns A function returning the current page and referrer context
 */
export function useGetSegmentContext(): () => SegmentContext {
  const store = useStore();
  const dataRouter = useContext(DataRouterContext);
  const { navigator } = useContext(NavigationContext);

  return useCallback(() => {
    // The data router (used by the app) holds the current location in its
    // state; memory, hash and browser routers expose it on their history.
    const location =
      dataRouter?.router.state.location ??
      (navigator as { location?: { pathname: string } }).location;
    const matchedPath = location
      ? findMatchingPath(location.pathname)
      : undefined;
    const origin = txDataSelector(store.getState())?.origin as
      | string
      | undefined;

    return {
      page: matchedPath
        ? {
            path: matchedPath,
            title: PATH_NAME_MAP.get(matchedPath),
            url: matchedPath,
          }
        : undefined,
      referrer: origin ? { url: origin } : undefined,
    };
  }, [store, dataRouter, navigator]);
}
