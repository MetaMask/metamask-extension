import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUseExternalServices } from '../../../selectors';
import { BASIC_FUNCTIONALITY_OFF_ROUTE } from '../../constants/routes';

export type BasicFunctionalityOffState = {
  /** Full path (pathname + search + hash) to restore when user opens the feature from the basic-functionality-off page. */
  blockedRoutePath: string;
  /** i18n message key for the full CTA (e.g. "basicFunctionalityRequired_openSwapsPage") so the button is a single translatable string per locale (avoids grammar issues in languages like Russian). */
  openPageCtaMessageKey: string;
};

type BasicFunctionalityRequiredProps = {
  children: React.ReactNode;
  /** i18n message key for the full "Open the [X] page" CTA (e.g. basicFunctionalityRequired_openSwapsPage). One key per destination so each locale can translate the whole sentence with correct grammar. */
  openPageCtaMessageKey?: string;
};

/**
 * Route guard that redirects to the basic-functionality-off screen when
 * useExternalServices is off. Passes current full path and CTA message key in location state
 * so the basic-functionality-off page can show a localized "Open the [X] page" button (full string per destination for correct grammar in all languages).
 *
 * @param props
 * @param props.children - Child route content to render when Basic Functionality is on.
 * @param props.openPageCtaMessageKey - i18n message key for the full CTA (e.g. basicFunctionalityRequired_openSwapsPage).
 */
const BasicFunctionalityRequired = ({
  children,
  openPageCtaMessageKey,
}: BasicFunctionalityRequiredProps) => {
  const useExternalServices = useSelector(getUseExternalServices);
  const location = useLocation();
  const blockedRoutePath = `${location.pathname}${location.search}${location.hash}`;

  if (useExternalServices !== true) {
    const state: BasicFunctionalityOffState = {
      blockedRoutePath,
      openPageCtaMessageKey: openPageCtaMessageKey ?? '',
    };
    return (
      <Navigate to={BASIC_FUNCTIONALITY_OFF_ROUTE} state={state} replace />
    );
  }

  return <>{children}</>;
};

export default BasicFunctionalityRequired;
