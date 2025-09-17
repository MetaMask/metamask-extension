import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, Route } from 'react-router-dom-v5-compat';
import { ONBOARDING_ROUTE } from '../../constants/routes';

const onboardingRoute = { pathname: ONBOARDING_ROUTE };

export default function Initialized(props) {
  return props.completedOnboarding ? (
    <Route {...props} />
  ) : (
    <Navigate to={onboardingRoute} />
  );
}

Initialized.propTypes = {
  completedOnboarding: PropTypes.bool,
  path: PropTypes.string,
  component: PropTypes.object,
  exact: PropTypes.bool,
};
