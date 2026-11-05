import { useCallback } from 'react';
import {
  useLocation,
  useNavigate,
  type NavigateFunction,
  type To,
} from 'react-router-dom';
import { PREVIOUS_ROUTE } from '../helpers/constants/routes';

type BackTransition = (navigateBack: () => void) => void;

// A replace keeps this history index and assigns a new location key.
// Index 0 is still the first entry, so Back must use the fallback route.
export function hasNoInAppHistory(location: { key: string; state: unknown }) {
  const historyIndex = globalThis.history?.state?.idx;
  return (
    location.key === 'default' ||
    historyIndex === 0 ||
    (location.state as { fromFreshTab?: boolean } | null)?.fromFreshTab === true
  );
}

/**
 * In-app Back button handler. Does not affect the browser Back button.
 *
 * If there is in-app navigation history, this handler pops one step back.
 * If not (e.g. direct navigation, deep link), it navigates to a fallback
 * route to stop the user from being taken to the previous browser page.
 * As it replaces during navigation,`fromFreshTab` is passed in location
 * state to ensure subsequent in-app Back clicks also have a fallback.
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
  const location = useLocation();
  const noInAppHistory = hasNoInAppHistory(location);

  return useCallback(() => {
    // Navigate to fallback route if there is no in-app history
    if (noInAppHistory) {
      navigate(fallbackRoute, {
        replace: true,
        state: { fromFreshTab: true },
      });
      return;
    }

    // Otherwise, navigate to previous page
    const navigateBack = () => navigate(PREVIOUS_ROUTE);
    if (transition) {
      transition(navigateBack);
    } else {
      navigateBack();
    }
  }, [fallbackRoute, noInAppHistory, navigate, transition]);
}
