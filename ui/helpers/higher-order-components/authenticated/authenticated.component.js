import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom-v5-compat';
import { UNLOCK_ROUTE, ONBOARDING_ROUTE } from '../../constants/routes';
import { useSetNavState } from '../../../contexts/navigation-state';

const OnboardingRoute = { pathname: ONBOARDING_ROUTE };

export default function Authenticated({
  isUnlocked,
  completedOnboarding,
  children,
}) {
  const location = useLocation();
  const setNavState = useSetNavState();

  // Store redirect location in navigation context when navigating to unlock
  // (HashRouter in v5-compat doesn't support state)
  useEffect(() => {
    if (!isUnlocked && completedOnboarding) {
      setNavState({
        from: {
          pathname: location.pathname,
          search: location.search,
        },
      });
    }
  }, [
    isUnlocked,
    completedOnboarding,
    location.pathname,
    location.search,
    setNavState,
  ]);

  switch (true) {
    case isUnlocked && completedOnboarding:
      return children;
    case !completedOnboarding:
      return <Navigate to={OnboardingRoute} replace />;
    default:
      return <Navigate to={UNLOCK_ROUTE} replace />;
  }
}

Authenticated.propTypes = {
  isUnlocked: PropTypes.bool,
  completedOnboarding: PropTypes.bool,
  children: PropTypes.node,
};
