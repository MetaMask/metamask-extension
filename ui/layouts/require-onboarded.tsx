import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ONBOARDING_ROUTE } from '../helpers/constants/routes';
import { getCompletedOnboarding } from '../ducks/metamask/metamask';
import { useAppSelector } from '../store/store';

export const RequireOnboarded = () => {
  const completedOnboarding = useAppSelector(getCompletedOnboarding);

  if (!completedOnboarding) {
    return <Navigate to={ONBOARDING_ROUTE} replace />;
  }

  return <Outlet />;
};
