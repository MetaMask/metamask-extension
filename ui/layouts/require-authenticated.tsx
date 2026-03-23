import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ONBOARDING_ROUTE, UNLOCK_ROUTE } from '../helpers/constants/routes';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../ducks/metamask/metamask';
import { useAppSelector } from '../store/store';
import { RootLayout } from './root-layout';

export const RequireAuthenticated = () => {
  const completedOnboarding = useAppSelector(getCompletedOnboarding);
  const isUnlocked = useAppSelector(getIsUnlocked);
  const location = useLocation();

  if (!completedOnboarding) {
    return <Navigate to={ONBOARDING_ROUTE} replace />;
  }

  if (!isUnlocked) {
    const from = `${location.pathname}${location.search}`;
    const searchParams = new URLSearchParams({ from });

    return (
      <Navigate to={`${UNLOCK_ROUTE}?${searchParams.toString()}`} replace />
    );
  }

  return <RootLayout />;
};
