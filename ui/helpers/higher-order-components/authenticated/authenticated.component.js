import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { UNLOCK_ROUTE, ONBOARDING_ROUTE } from '../../constants/routes';

/**
 * Authenticated - A wrapper component for v6 routes that require authentication
 *
 * This component checks if the user is unlocked and has completed onboarding.
 * If not, it redirects to the appropriate route using v6 Navigate.
 *
 * @param {object} props - Component props
 * @param {boolean} props.isUnlocked - Whether the user is unlocked
 * @param {boolean} props.completedOnboarding - Whether the user has completed onboarding
 * @param {React.ReactNode} props.children - Child elements to render if authenticated
 * @returns {React.Element} Children or Navigate component
 */
export default function Authenticated({
  isUnlocked,
  completedOnboarding,
  children,
}) {
  const location = useLocation();

  if (!completedOnboarding) {
    return <Navigate to={ONBOARDING_ROUTE} replace />;
  }

  if (!isUnlocked) {
    return <Navigate to={UNLOCK_ROUTE} replace state={{ from: location }} />;
  }

  return children;
}

Authenticated.propTypes = {
  isUnlocked: PropTypes.bool,
  completedOnboarding: PropTypes.bool,
  children: PropTypes.node,
};
