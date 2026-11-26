import React, { type ComponentType } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { SECURITY_AND_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { getIsMfaUiKitEnabled } from '../../../selectors/identity/mfa-ui-kit';

/**
 * Shows an MFA settings page only while the `mfaUiKit` flag is on. Settings
 * routes are registered when the module loads, before flags arrive, so a page
 * opened by its URL while the flag is off goes back to Security & password.
 *
 * @param Page - The settings page.
 * @returns The gated page.
 */
export const withMfaUiKit = <Props extends object>(
  Page: ComponentType<Props>,
) => {
  const MfaUiKitPage = (props: Props) =>
    useSelector(getIsMfaUiKitEnabled) ? (
      <Page {...props} />
    ) : (
      <Navigate to={SECURITY_AND_PASSWORD_ROUTE} replace />
    );
  return MfaUiKitPage;
};
