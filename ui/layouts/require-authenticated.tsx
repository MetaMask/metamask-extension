import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { setOnboardingRedirect } from '#ui/ducks/app/app';
import { getRedirectAfterUnlock } from '#ui/helpers/utils/redirect-after-unlock';
import { useDispatch } from '#ui/store/hooks';
import {
  DEFAULT_ROUTE,
  ONBOARDING_ROUTE,
  UNLOCK_ROUTE,
} from '#ui/helpers/constants/routes';
import { getCompletedOnboarding } from '../ducks/metamask/metamask';
import { getIsUnlocked } from '../ducks/metamask/base-selectors';
import { RootLayout } from './root-layout';

export const RequireAuthenticated = () => {
  const dispatch = useDispatch();
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isUnlocked = useSelector(getIsUnlocked);
  const location = useLocation();
  const redirectTo = getRedirectAfterUnlock({ from: location });

  useEffect(() => {
    if (!completedOnboarding) {
      dispatch(
        setOnboardingRedirect(redirectTo === DEFAULT_ROUTE ? null : redirectTo),
      );
    }
  }, [completedOnboarding, dispatch, redirectTo]);

  if (!completedOnboarding) {
    return <Navigate to={ONBOARDING_ROUTE} replace />;
  }

  if (!isUnlocked) {
    return <Navigate to={UNLOCK_ROUTE} state={{ from: location }} replace />;
  }

  return <RootLayout />;
};
