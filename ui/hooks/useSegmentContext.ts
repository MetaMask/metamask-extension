import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, matchPath } from 'react-router-dom';
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
