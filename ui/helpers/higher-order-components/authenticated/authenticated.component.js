import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route } from 'react-router-dom';
import {
  UNLOCK_ROUTE,
  INITIALIZE_ROUTE,
  ONBOARDING_ROUTE,
} from '../../constants/routes';

export default function Authenticated(props) {
  const { isUnlocked, completedOnboarding } = props;
  if (process.env.ONBOARDING_V2) {
    return <Redirect to={{ pathname: ONBOARDING_ROUTE }} />;
  }
  switch (true) {
    case process.env.ONBOARDING_V2 === true:
      return <Redirect to={{ pathname: ONBOARDING_ROUTE }} />;
    case isUnlocked && completedOnboarding:
      return <Route {...props} />;
    case !completedOnboarding:
      return <Redirect to={{ pathname: INITIALIZE_ROUTE }} />;
    default:
      return <Redirect to={{ pathname: UNLOCK_ROUTE }} />;
  }
}

Authenticated.propTypes = {
  isUnlocked: PropTypes.bool,
  completedOnboarding: PropTypes.bool,
};
