import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route, useLocation } from 'react-router-dom';
import { UNLOCK_ROUTE, ONBOARDING_ROUTE } from '../../constants/routes';

const OnboardingRoute = { pathname: ONBOARDING_ROUTE };

/**
 * Authenticated - A wrapper component for v5 routes that require authentication
 *
 * This component checks if the user is unlocked and has completed onboarding.
 * If not, it redirects to the appropriate route using v5 Redirect.
 *
 * This is the original v5 implementation - for v5-compat routes, use AuthenticatedV5Compat instead.
 *
 * @param {object} props - Component props
 * @returns {React.Element} Route or Redirect component
 */
export default function Authenticated(props) {
  const { isUnlocked, completedOnboarding } = props;
  const location = useLocation();

  switch (true) {
    case isUnlocked && completedOnboarding:
      return <Route {...props} />;
    case !completedOnboarding:
      return <Redirect to={OnboardingRoute} />;
    default:
      return (
        <Redirect to={{ pathname: UNLOCK_ROUTE, state: { from: location } }} />
      );
  }
}

Authenticated.propTypes = {
  isUnlocked: PropTypes.bool,
  completedOnboarding: PropTypes.bool,
  path: PropTypes.string,
  component: PropTypes.elementType,
  exact: PropTypes.bool,
};
