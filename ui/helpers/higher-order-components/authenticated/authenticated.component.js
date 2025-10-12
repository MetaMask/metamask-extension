import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom-v5-compat';
import { UNLOCK_ROUTE, ONBOARDING_ROUTE } from '../../constants/routes';
import { useSafeNavigation } from '../../../hooks/useSafeNavigation';

export default function Authenticated({
  isUnlocked,
  completedOnboarding,
  children,
}) {
  const { location, setNavState } = useSafeNavigation();

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
    } else if (isUnlocked) {
      // Clear navigation state when user is unlocked to prevent stale redirects
      setNavState(null);
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
      return <Navigate to={ONBOARDING_ROUTE} replace />;
    default:
      return <Navigate to={UNLOCK_ROUTE} replace />;
  }
}

Authenticated.propTypes = {
  isUnlocked: PropTypes.bool,
  completedOnboarding: PropTypes.bool,
  children: PropTypes.node,
};
