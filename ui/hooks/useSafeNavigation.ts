import { useNavigate, useLocation } from 'react-router-dom-v5-compat';
import { useCallback } from 'react';
import { useSetNavState } from '../contexts/navigation-state';

type SafeNavigateOptions = {
  state?: Record<string, unknown>;
  replace?: boolean;
};

export const useSafeNavigation = (
  customNavigate?: (path: string, options?: SafeNavigateOptions) => void,
): {
  navigate: (path: string, options?: SafeNavigateOptions) => void;
  location: ReturnType<typeof useLocation>;
} => {
  const defaultNavigate = useNavigate();
  const location = useLocation();
  const setNavState = useSetNavState();

  // Memoize the navigate function to prevent unnecessary re-renders
  // This is critical for useEffect dependencies that include navigate
  const safeNavigate = useCallback(
    (path: string, options?: SafeNavigateOptions) => {
      if (options?.state) {
        setNavState(options.state);
      } else {
        setNavState(null);
      }

      if (customNavigate) {
        customNavigate(path, options);
        return;
      }

      defaultNavigate(path, {
        replace: Boolean(options?.replace),
        state: options?.state,
      });
      setTimeout(() => {
        setNavState(null);
      }, 100);
    },
    [customNavigate, defaultNavigate, setNavState],
  );

  return {
    navigate: safeNavigate,
    location,
  };
};
