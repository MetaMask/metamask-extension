import { useSelector } from 'react-redux';
import { useLocation, matchPath } from 'react-router-dom-v5-compat';
import { PATH_NAME_MAP, getPaths } from '../helpers/constants/routes';
import { txDataSelector } from '../selectors';

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
  const match = matchPath(
    {
      path: getPaths(),
      exact: true,
      strict: true,
    },
    location.pathname,
  );
  const txData = useSelector(txDataSelector) || {};
  const confirmTransactionOrigin = txData.origin;

  const referrer = confirmTransactionOrigin
    ? {
        url: confirmTransactionOrigin,
      }
    : undefined;

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
