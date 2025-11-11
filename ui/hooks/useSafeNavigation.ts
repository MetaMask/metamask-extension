import { useNavigate, useLocation } from 'react-router-dom-v5-compat';
import { useCallback, useRef, useEffect } from 'react';
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
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, []);

  // Memoize the navigate function to prevent unnecessary re-renders
  // This is critical for useEffect dependencies that include navigate
  const safeNavigate = useCallback(
    (path: string, options?: SafeNavigateOptions) => {
      if (options?.state) {
        setNavState(options.state);
      } else {
        setNavState(null);
      }

      // Clear any existing timeout before scheduling a new one
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }

      // Schedule cleanup for both custom and default navigate to prevent memory leaks
      cleanupTimeoutRef.current = setTimeout(() => {
        setNavState(null);
        cleanupTimeoutRef.current = null;
      }, 100);

      if (customNavigate) {
        customNavigate(path, options);
        return;
      }

      defaultNavigate(path, {
        replace: Boolean(options?.replace),
        state: options?.state,
      });
    },
    [customNavigate, defaultNavigate, setNavState],
  );

  return {
    navigate: safeNavigate,
    location,
  };
};
