import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PREVIOUS_ROUTE } from '../../helpers/constants/routes';

/**
 * Returns a back handler that keeps the user inside MetaMask.
 *
 * Money routes can be opened directly, e.g. by pasting an activity URL into a
 * new window. The current entry is then the first one in the browser history,
 * so history-based back navigation would leave the extension. React Router
 * reports that entry with a `default` location key, in which case we route to
 * an explicit in-app screen instead.
 *
 * @param fallbackRoute - Route to land on when there is no in-app history.
 * @returns The back-navigation handler.
 */
export function useMoneyBackNavigation(fallbackRoute: string): () => void {
  const navigate = useNavigate();
  const { key } = useLocation();

  return useCallback(() => {
    if (key === 'default') {
      navigate(fallbackRoute, { replace: true });
    } else {
      navigate(PREVIOUS_ROUTE);
    }
  }, [fallbackRoute, key, navigate]);
}
