import { useSelector } from 'react-redux';
import React from 'react';

import { getAppIsLoading } from '../../../selectors';
import Spinner from '../../ui/spinner';

const AppLoadingSpinner = () => {
  const appIsLoading = useSelector(getAppIsLoading);

  if (!appIsLoading) return null;

  return (
    <div className="app-loading-spinner__wrapper">
      <Spinner color="#F7C06C" />
    </div>
  );
};

export default AppLoadingSpinner;
