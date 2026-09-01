import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUseExternalServices } from '../../../selectors';
import { BASIC_FUNCTIONALITY_OFF_ROUTE } from '../../constants/routes';

export type BasicFunctionalityOffState = {
  /** Full path (pathname + search + hash) to restore when user opens the feature from the basic-functionality-off page. */
  blockedRoutePath: string;
};

/**
 * Route guard that redirects to the basic-functionality-off screen when
 * useExternalServices is off.
 */
const BasicFunctionalityRequired = () => {
  const useExternalServices = useSelector(getUseExternalServices);
  const location = useLocation();
  const blockedRoutePath = `${location.pathname}${location.search}${location.hash}`;

  if (useExternalServices !== true) {
    const state: BasicFunctionalityOffState = {
      blockedRoutePath,
    };

    return (
      <Navigate to={BASIC_FUNCTIONALITY_OFF_ROUTE} state={state} replace />
    );
  }

  return <Outlet />;
};

export default BasicFunctionalityRequired;
