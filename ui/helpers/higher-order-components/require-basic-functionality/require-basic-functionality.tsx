import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUseExternalServices } from '../../../selectors';
import { BASIC_FUNCTIONALITY_OFF_ROUTE } from '../../constants/routes';

export type BasicFunctionalityOffState = {
  blockedRoutePath: string;
  featureName: string;
};

type BasicFunctionalityRequiredProps = {
  children: React.ReactNode;
  /** Display name for the feature (e.g. "Swap", "Rewards") for the basic-functionality-off page CTA. */
  featureName?: string;
};

/**
 * Route guard that redirects to the basic-functionality-off screen when
 * useExternalServices is off. Passes current pathname and feature name in location state
 * so the basic-functionality-off page can show "Open the [feature name] page" and an inline toggle.
 *
 * @param props
 * @param props.children - Child route content to render when Basic Functionality is on.
 * @param props.featureName - Display name for the feature (e.g. "Swap", "Rewards") for the basic-functionality-off page CTA.
 */
const BasicFunctionalityRequired = ({
  children,
  featureName,
}: BasicFunctionalityRequiredProps) => {
  const useExternalServices = useSelector(getUseExternalServices);
  const location = useLocation();
  const blockedRoutePath = location.pathname;

  if (useExternalServices !== true) {
    const state: BasicFunctionalityOffState = {
      blockedRoutePath,
      featureName: featureName ?? '',
    };
    return (
      <Navigate to={BASIC_FUNCTIONALITY_OFF_ROUTE} state={state} replace />
    );
  }

  return <>{children}</>;
};

export default BasicFunctionalityRequired;
