import { useSelector } from 'react-redux';
import { useLocation, matchPath } from 'react-router-dom-v5-compat';
import { PATH_NAME_MAP, getPaths } from '../helpers/constants/routes';

/**
 * Returns the current page if it matches our route map, as well as the origin
 * if there is a confirmation that was triggered by a dapp. These values are
 * not required but add valuable context to events, and should be included in
 * the context object on the event payload.
 *
 * @returns {{
 *  page?: MetaMetricsPageObject
 *  referrer?: MetaMetricsReferrerObject
 * }}
 */
export function useSegmentContext() {
  const location = useLocation();
  const txData = useSelector((state) => state.confirmTransaction?.txData) || {};
  const confirmTransactionOrigin = txData.origin;

  const referrer = confirmTransactionOrigin
    ? {
        url: confirmTransactionOrigin,
      }
    : undefined;

  // Find the matching path using v6 matchPath
  const paths = getPaths();
  let match = null;
  for (const path of paths) {
    match = matchPath(
      {
        path,
        end: true,
        caseSensitive: false,
      },
      location.pathname,
    );
    if (match) {
      match.path = path; // Add the path back for compatibility
      break;
    }
  }

  const page = match
    ? {
        path: match.path,
        title: PATH_NAME_MAP.get(match.path),
        url: match.path,
      }
    : undefined;

  return {
    page,
    referrer,
  };
}
