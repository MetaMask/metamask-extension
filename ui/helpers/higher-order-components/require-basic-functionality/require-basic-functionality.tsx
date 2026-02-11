import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUseExternalServices } from '../../../selectors';
import { BASIC_FUNCTIONALITY_REQUIRED_ROUTE } from '../../constants/routes';

type RequireBasicFunctionalityProps = {
  children: React.ReactNode;
};

/**
 * Route guard that redirects to the "feature unavailable" screen when
 * useExternalServices is off. Use this for routes that depend on external services
 * (e.g. swap, rewards).
 *
 * @param options0
 * @param options0.children
 */
const RequireBasicFunctionality = ({
  children,
}: RequireBasicFunctionalityProps) => {
  const useExternalServices = useSelector(getUseExternalServices);

  if (!useExternalServices) {
    return <Navigate to={BASIC_FUNCTIONALITY_REQUIRED_ROUTE} replace />;
  }

  return <>{children}</>;
};

export default RequireBasicFunctionality;
