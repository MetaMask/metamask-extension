import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route } from 'react-router-dom';
import { ONBOARDING_ROUTE } from '../../constants/routes';

const onboardingRoute = { pathname: ONBOARDING_ROUTE };

export default function Initialized(props) {
  return props.completedOnboarding ? (
    <Route {...props} />
  ) : (
    <Redirect to={onboardingRoute} />
  );
}

Initialized.propTypes = {
  completedOnboarding: PropTypes.bool,
  path: PropTypes.string,
  component: PropTypes.object,
};
