import { useSelector } from 'react-redux';
import { useLocation, matchPath } from 'react-router-dom-v5-compat';
import { PATH_NAME_MAP, getPaths } from '../helpers/constants/routes';
import { txDataSelector } from '../selectors';

/**
 * Returns the current page if it matches our route map, as well as the origin
 * if there is a confirmation that was triggered by a dapp.
 */
export function useSegmentContext() {
  const location = useLocation();
  const paths = getPaths();
  const txData = useSelector(txDataSelector) || {};
  const confirmTransactionOrigin = txData.origin;

  const referrer = confirmTransactionOrigin
    ? { url: confirmTransactionOrigin }
    : undefined;

  const match = paths.find((path) =>
    matchPath(location.pathname, { path, exact: true, strict: true }),
  );

  const page = match
    ? {
        path: match,
        title: PATH_NAME_MAP.get(match),
        url: match,
      }
    : undefined;

  return { page, referrer };
}
