import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ONBOARDING_ROUTE, UNLOCK_ROUTE } from '../helpers/constants/routes';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';

/**
 * Auth guard that renders its children without the RootLayout max-width wrapper.
 *
 * Use this for routes that need to span the full viewport width (e.g. the
 * perps expanded trading view). Applies the same onboarding / unlock checks
 * as RequireAuthenticated, but renders <Outlet /> directly instead of
 * wrapping in RootLayout.
 */
export const RequireAuthenticatedFullWidth = () => {
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const location = useLocation();

  if (!completedOnboarding) {
    return <Navigate to={ONBOARDING_ROUTE} replace />;
  }

  if (!isUnlocked) {
    return <Navigate to={UNLOCK_ROUTE} state={{ from: location }} replace />;
  }

  return <Outlet />;
};
