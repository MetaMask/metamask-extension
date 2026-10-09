import { useCallback } from 'react';
import {
  useLocation,
  useNavigate,
  type NavigateFunction,
  type To,
} from 'react-router-dom';
import { PREVIOUS_ROUTE } from '../helpers/constants/routes';

type BackTransition = (navigateBack: () => void) => void;

type InAppBackFallback = To | (() => void);

function isFallbackNavigate(
  fallback: InAppBackFallback,
): fallback is () => void {
  return typeof fallback === 'function';
}

export const getHasNoInAppHistory = ({
  key,
  state,
}: {
  key: string;
  state: unknown;
}) =>
  key === 'default' ||
  (state as { fromFreshTab?: boolean } | null)?.fromFreshTab === true;

/**
 * In-app Back button handler. Does not affect the browser Back button.
 *
 * If there is in-app navigation history, this handler pops one step back.
 * If not (e.g. direct navigation, deep link), it navigates to a fallback
 * route to stop the user from being taken to the previous browser page.
 * As it replaces during navigation,`fromFreshTab` is passed in location
 * state to ensure subsequent in-app Back clicks also have a fallback.
 *
 * Pass a function instead of a route when the no-history navigation
 * chooses its own destination.
 *
 * @param fallback - Route, or navigate function, used when there is no in-app history.
 * @param transition - Optional transition around history navigation.
 * @returns The in-app back-button handler.
 */
export function useInAppBack(
  fallback: InAppBackFallback,
  transition?: BackTransition,
): () => void {
  const navigate: NavigateFunction = useNavigate();
  const { key, state } = useLocation();
  const hasNoInAppHistory = getHasNoInAppHistory({ key, state });

  return useCallback(() => {
    // Navigate to fallback route if there is no in-app history
    if (hasNoInAppHistory) {
      if (isFallbackNavigate(fallback)) {
        fallback();
        return;
      }

      navigate(fallback, {
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
  }, [fallback, hasNoInAppHistory, navigate, transition]);
}
