import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route } from 'react-router-dom';

export default function FeatureToggledRoute({ flag, redirectRoute, ...props }) {
  if (flag) {
    return <Route {...props} />;
  }
  return <Redirect to={{ pathname: redirectRoute }} />;
}

FeatureToggledRoute.propTypes = {
  flag: PropTypes.bool.isRequired,
  redirectRoute: PropTypes.string.isRequired,
};
