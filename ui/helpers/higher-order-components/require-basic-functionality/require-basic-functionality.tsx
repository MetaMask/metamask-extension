import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUseExternalServices } from '../../../selectors';
import { BASIC_FUNCTIONALITY_OFF_ROUTE } from '../../constants/routes';

/**
 * Route guard that redirects to the basic-functionality-off screen when
 * useExternalServices is off.
 */
const BasicFunctionalityRequired = () => {
  const useExternalServices = useSelector(getUseExternalServices);
  const location = useLocation();

  if (useExternalServices !== true) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    const searchParams = new URLSearchParams({ from });

    return (
      <Navigate
        to={`${BASIC_FUNCTIONALITY_OFF_ROUTE}?${searchParams.toString()}`}
        replace
      />
    );
  }

  return <Outlet />;
};

export default BasicFunctionalityRequired;
