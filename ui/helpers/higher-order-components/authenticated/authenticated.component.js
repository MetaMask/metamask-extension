import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route, useLocation } from 'react-router-dom';
import { UNLOCK_ROUTE, ONBOARDING_ROUTE } from '../../constants/routes';

const OnboardingRoute = { pathname: ONBOARDING_ROUTE };

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
  component: PropTypes.object,
};
