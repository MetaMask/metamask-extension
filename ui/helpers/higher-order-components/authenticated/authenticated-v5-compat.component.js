import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom-v5-compat';
import { useLocation } from 'react-router-dom';
import { UNLOCK_ROUTE, ONBOARDING_ROUTE } from '../../constants/routes';

/**
 * AuthenticatedV5Compat - A wrapper component for v5-compat routes that require authentication
 *
 * This component checks if the user is unlocked and has completed onboarding.
 * If not, it redirects to the appropriate route using v5-compat Navigate.
 *
 * Unlike the v5 Authenticated HOC, this returns the element directly (not wrapped in Route)
 * because v5-compat Routes handle their children differently.
 */
export default function AuthenticatedV5Compat({ isUnlocked, completedOnboarding, children }) {
  const location = useLocation();

  // Check authentication state - use v5-compat Navigate
  if (!completedOnboarding) {
    return <Navigate to={ONBOARDING_ROUTE} replace />;
  }

  if (!isUnlocked) {
    return <Navigate to={UNLOCK_ROUTE} replace state={{ from: location }} />;
  }

  // If authenticated, render children
  return children;
}

AuthenticatedV5Compat.propTypes = {
  isUnlocked: PropTypes.bool,
  completedOnboarding: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

