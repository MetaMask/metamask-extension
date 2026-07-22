import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ONBOARDING_WELCOME_ROUTE } from '../../../helpers/constants/routes';
import {
  forceUpdateMetamaskState,
  resetOnboarding,
} from '../../../store/actions';

/**
 * Returns a stable callback that resets the onboarding state, forces a
 * MetaMask state refresh, and navigates back to the welcome route.
 *
 * This sequence was previously repeated verbatim in account-exist,
 * account-not-found, import-srp, and create-password.
 */
export function useOnboardingReset() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useCallback(async () => {
    await dispatch(resetOnboarding());
    await forceUpdateMetamaskState(dispatch);
    navigate(ONBOARDING_WELCOME_ROUTE, { replace: true });
  }, [dispatch, navigate]);
}
