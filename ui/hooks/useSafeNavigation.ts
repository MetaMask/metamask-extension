import { useNavigate, useLocation } from 'react-router-dom-v5-compat';
import { useSetNavState } from '../contexts/navigation-state';

export const useSafeNavigation = (): {
  navigate: (path: string, state?: Record<string, unknown> | null) => void;
  location: ReturnType<typeof useLocation>;
  setNavState: ReturnType<typeof useSetNavState>;
} => {
  const navigate = useNavigate();
  const location = useLocation();
  const setNavState = useSetNavState();

  const safeNavigate = (
    path: string,
    state?: Record<string, unknown> | null,
  ) => {
    if (state) {
      setNavState(state);
    } else {
      setNavState(null);
    }
    navigate(path);
  };

  return {
    navigate: safeNavigate,
    location,
    setNavState,
  };
};
