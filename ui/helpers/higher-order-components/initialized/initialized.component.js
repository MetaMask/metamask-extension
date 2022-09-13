import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route } from 'react-router-dom';
import { INITIALIZE_ROUTE, ONBOARDING_ROUTE } from '../../constants/routes';

export default function Initialized(props) {
  return props.completedOnboarding ? (
    <Route {...props} />
  ) : (
    <Redirect
      to={{
        pathname: process.env.ONBOARDING_V2
          ? ONBOARDING_ROUTE
          : INITIALIZE_ROUTE,
      }}
    />
  );
}

Initialized.propTypes = {
  completedOnboarding: PropTypes.bool,
};
