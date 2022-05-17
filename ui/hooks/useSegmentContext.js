import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';
import { PATH_NAME_MAP } from '../helpers/constants/routes';
import { txDataSelector } from '../selectors';

const PATHS_TO_CHECK = Object.keys(PATH_NAME_MAP);

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
  const match = useRouteMatch({
    path: PATHS_TO_CHECK,
    exact: true,
    strict: true,
  });
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
        title: PATH_NAME_MAP[match.path],
        url: match.path,
      }
    : undefined;

  return {
    page,
    referrer,
  };
}
