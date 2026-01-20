import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { ONBOARDING_ROUTE } from '../../constants/routes';

/**
 * Initialized - A wrapper component for v6 routes that require onboarding completion
 *
 * This component checks if the user has completed onboarding.
 * If not, it redirects to the onboarding route using v6 Navigate.
 *
 * @param {object} props - Component props
 * @param {boolean} props.completedOnboarding - Whether the user has completed onboarding
 * @param {React.ReactNode} props.children - Child elements to render if initialized
 * @returns {React.Element} Children or Navigate component
 */
export default function Initialized({ completedOnboarding, children }) {
  if (!completedOnboarding) {
    return <Navigate to={ONBOARDING_ROUTE} replace />;
  }

  return children;
}

Initialized.propTypes = {
  completedOnboarding: PropTypes.bool,
  children: PropTypes.node,
};
