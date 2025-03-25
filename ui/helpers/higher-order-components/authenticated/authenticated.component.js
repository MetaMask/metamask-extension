import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route } from 'react-router-dom';
import { UNLOCK_ROUTE, ONBOARDING_ROUTE } from '../../constants/routes';

const OnboardingRoute = { pathname: ONBOARDING_ROUTE };
const UnlockRoute = { pathname: UNLOCK_ROUTE };

export default function Authenticated(props) {
  const { isUnlocked, completedOnboarding } = props;
  switch (true) {
    case isUnlocked && completedOnboarding:
      return <Route {...props} />;
    case !completedOnboarding:
      return <Redirect to={OnboardingRoute} />;
    default:
      return <Redirect to={UnlockRoute} />;
  }
}

Authenticated.propTypes = {
  isUnlocked: PropTypes.bool,
  completedOnboarding: PropTypes.bool,
};
