import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, Route } from 'react-router-dom-v5-compat';

export default function FeatureToggledRoute({ flag, redirectRoute, ...props }) {
  if (flag) {
    return <Route {...props} />;
  }

  return <Navigate to={redirectRoute} replace />;
}

FeatureToggledRoute.propTypes = {
  flag: PropTypes.bool.isRequired,
  redirectRoute: PropTypes.string.isRequired,
};
