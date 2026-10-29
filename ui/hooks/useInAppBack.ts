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
  const { key, state } = useLocation();

  const hasNoInAppHistory =
    key === 'default' ||
    (state as { fromFreshTab?: boolean } | null)?.fromFreshTab === true;

  return useCallback(() => {
    // Navigate to fallback route if there is no in-app history
    if (hasNoInAppHistory) {
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
  }, [fallbackRoute, hasNoInAppHistory, navigate, transition]);
}
