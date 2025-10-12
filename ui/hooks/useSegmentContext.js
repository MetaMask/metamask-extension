import { useSelector } from 'react-redux';
import { safeMatchPath } from '../utils/safeRouteMatching';
import { PATH_NAME_MAP, getPaths } from '../helpers/constants/routes';
import { txDataSelector } from '../selectors';
import { useSafeNavigation } from './useSafeNavigation';

/**
 * Returns the current page if it matches our route map, as well as the origin
 * if there is a confirmation that was triggered by a dapp.
 */
export function useSegmentContext() {
  const { location } = useSafeNavigation();
  const paths = getPaths();
  const txData = useSelector(txDataSelector) || {};
  const confirmTransactionOrigin = txData.origin;

  const referrer = confirmTransactionOrigin
    ? { url: confirmTransactionOrigin }
    : undefined;

  // Use safe location from useSafeNavigation hook
  const safePathname = location.pathname;

  const match = paths.find((path) => {
    return safeMatchPath({ path, exact: true, strict: true }, safePathname);
  });

  const page = match
    ? {
        path: match,
        title: PATH_NAME_MAP.get(match),
        url: match,
      }
    : {
        path: safePathname,
        title: 'Home',
        url: safePathname,
      };

  return { page, referrer };
}
