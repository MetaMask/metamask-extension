import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ONBOARDING_ROUTE } from '../helpers/constants/routes';
import { getCompletedOnboarding } from '../ducks/metamask/metamask';

export const RequireOnboarded = () => {
  const completedOnboarding = useSelector(getCompletedOnboarding);

  if (!completedOnboarding) {
    return <Navigate to={ONBOARDING_ROUTE} replace />;
  }

  return <Outlet />;
};
