import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUseExternalServices } from '../../../selectors';
import { BASIC_FUNCTIONALITY_OFF_ROUTE } from '../../constants/routes';

export type BasicFunctionalityOffState = {
  /** Full path (pathname + search + hash) to restore when user opens the feature from the basic-functionality-off page. */
  blockedRoutePath: string;
  /** i18n message key for the feature name (e.g. "swap", "rewards") so the basic-functionality-off page CTA is localized. */
  localizedFeatureName: string;
};

type BasicFunctionalityRequiredProps = {
  children: React.ReactNode;
  /** i18n message key for the feature name (e.g. "swap", "notifications"). Same keys used in nav/tabs so the CTA is localized. */
  localizedFeatureName?: string;
};

/**
 * Route guard that redirects to the basic-functionality-off screen when
 * useExternalServices is off. Passes current full path (pathname + search + hash) and feature name i18n key in location state
 * so the basic-functionality-off page can show "Open the [localized feature name] page" and restore the original URL when opened.
 *
 * @param props
 * @param props.children - Child route content to render when Basic Functionality is on.
 * @param props.localizedFeatureName - i18n message key for the feature (e.g. "swap", "notifications") so the CTA is localized.
 */
const BasicFunctionalityRequired = ({
  children,
  localizedFeatureName,
}: BasicFunctionalityRequiredProps) => {
  const useExternalServices = useSelector(getUseExternalServices);
  const location = useLocation();
  const blockedRoutePath = `${location.pathname}${location.search}${location.hash}`;

  if (useExternalServices !== true) {
    const state: BasicFunctionalityOffState = {
      blockedRoutePath,
      localizedFeatureName: localizedFeatureName ?? '',
    };
    return (
      <Navigate to={BASIC_FUNCTIONALITY_OFF_ROUTE} state={state} replace />
    );
  }

  return <>{children}</>;
};

export default BasicFunctionalityRequired;
