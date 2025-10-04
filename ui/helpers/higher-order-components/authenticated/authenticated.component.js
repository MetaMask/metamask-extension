import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom-v5-compat';
import { UNLOCK_ROUTE, ONBOARDING_ROUTE } from '../../constants/routes';

const OnboardingRoute = { pathname: ONBOARDING_ROUTE };

export default function Authenticated({
  isUnlocked,
  completedOnboarding,
  children,
}) {
  const location = useLocation();

  switch (true) {
    case isUnlocked && completedOnboarding:
      return children;
    case !completedOnboarding:
      return <Navigate to={OnboardingRoute} replace />;
    default:
      return <Navigate to={UNLOCK_ROUTE} state={{ from: location }} replace />;
  }
}

Authenticated.propTypes = {
  isUnlocked: PropTypes.bool,
  completedOnboarding: PropTypes.bool,
  children: PropTypes.node,
};
