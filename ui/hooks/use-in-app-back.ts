import { useCallback } from 'react';
import {
  useLocation,
  useNavigate,
  type NavigateFunction,
  type To,
} from 'react-router-dom';
import { PREVIOUS_ROUTE } from '../helpers/constants/routes';

type BackTransition = (navigateBack: () => void) => void;

/**
 * Returns a handler for MM back buttons that don't unintentionally leave MM.
 *
 * React Router gives the first entry in a window the `default` location key.
 * Going back from that entry would leave the extension, so this handler
 * replaces it with an explicit in-app fallback instead. Browser back
 * navigation is intentionally unaffected.
 *
 * @param fallbackRoute - Route used when there is no in-app history.
 * @param transition - Optional transition around history navigation.
 * @returns The in-app back-button handler.
 */
export function useInAppBack(
  fallbackRoute: To,
  transition?: BackTransition,
): () => void {
  const navigate: NavigateFunction = useNavigate();
  const { key } = useLocation();

  return useCallback(() => {
    if (key === 'default') {
      navigate(fallbackRoute, { replace: true });
      return;
    }

    const navigateBack = () => navigate(PREVIOUS_ROUTE);
    if (transition) {
      transition(navigateBack);
    } else {
      navigateBack();
    }
  }, [fallbackRoute, key, navigate, transition]);
}
