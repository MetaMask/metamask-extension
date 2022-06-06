import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';

import { getAppIsLoading } from '../../../selectors';
import Spinner from '../../ui/spinner';

const AppLoadingSpinner = ({ className }) => {
  const appIsLoading = useSelector(getAppIsLoading);

  if (!appIsLoading) {
    return null;
  }

  return (
    <div
      className={`${className} app-loading-spinner`}
      role="alert"
      aria-busy="true"
    >
      <Spinner
        color="var(--color-secondary-muted)"
        className="app-loading-spinner__inner"
      />
    </div>
  );
};

AppLoadingSpinner.propTypes = {
  className: PropTypes.string,
};

export default AppLoadingSpinner;
