import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Redirect, Route } from 'react-router-dom';

export default function FeatureToggledRoute({ flag, redirectRoute, ...props }) {
  const redirect = useMemo(
    () => ({ pathname: redirectRoute }),
    [redirectRoute],
  );
  if (flag) {
    return <Route {...props} />;
  }
  return <Redirect to={redirect} />;
}

FeatureToggledRoute.propTypes = {
  flag: PropTypes.bool.isRequired,
  redirectRoute: PropTypes.string.isRequired,
};
