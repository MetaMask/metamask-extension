import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom-v5-compat';

export default function FeatureToggledRoute({ flag, redirectRoute, element }) {
  if (flag) {
    return element;
  }
  return <Navigate to={redirectRoute} replace />;
}

FeatureToggledRoute.propTypes = {
  flag: PropTypes.bool.isRequired,
  redirectRoute: PropTypes.string.isRequired,
  element: PropTypes.node.isRequired,
};
