import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ONBOARDING_ROUTE, UNLOCK_ROUTE } from '../helpers/constants/routes';
import { getCompletedOnboarding } from '../ducks/metamask/metamask';
import { getIsUnlocked } from '../ducks/metamask/base-selectors';

/**
 * Shared authentication guard used by authenticated route layouts.
 *
 * Returns a `<Navigate />` redirect element when the user has not completed
 * onboarding or the wallet is locked, otherwise `null`. Centralising the
 * onboarding / unlock checks here keeps every authenticated layout
 * (standard width, full width, …) in lockstep instead of duplicating the
 * logic per layout.
 *
 * @returns A redirect element when access should be blocked, otherwise `null`.
 */
export const useAuthGuardRedirect = (): React.ReactElement | null => {
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const location = useLocation();

  if (!completedOnboarding) {
    return <Navigate to={ONBOARDING_ROUTE} replace />;
  }

  if (!isUnlocked) {
    return <Navigate to={UNLOCK_ROUTE} state={{ from: location }} replace />;
  }

  return null;
};
