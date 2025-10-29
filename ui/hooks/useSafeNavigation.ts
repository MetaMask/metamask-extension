import { useNavigate, useLocation } from 'react-router-dom-v5-compat';
import { useSetNavState } from '../contexts/navigation-state';

type SafeNavigateOptions = {
  state?: Record<string, unknown> | null;
};

/**
 * Custom hook for safe navigation in v5-compat environments
 *
 * v5-compat's navigate() doesn't support the state option like v5 does.
 * This hook provides a wrapper that uses context to store and retrieve
 * navigation state.
 *
 * Usage:
 *   const { navigate } = useSafeNavigation();
 *   navigate('/path', { state: { key: 'value' } });
 *
 * Then retrieve the state on the destination component:
 *   const navState = useNavState();
 */
export const useSafeNavigation = (): {
  navigate: (path: string, options?: SafeNavigateOptions) => void;
  location: ReturnType<typeof useLocation>;
} => {
  const navigate = useNavigate();
  const location = useLocation();
  const setNavState = useSetNavState();

  const safeNavigate = (
    path: string,
    options?: SafeNavigateOptions,
  ) => {
    if (options?.state) {
      setNavState(options.state);
    } else {
      setNavState(null);
    }
    navigate(path);
    // Clear the state after a short delay to prevent stale state
    setTimeout(() => {
      setNavState(null);
    }, 100);
  };

  return {
    navigate: safeNavigate,
    location,
  };
};
