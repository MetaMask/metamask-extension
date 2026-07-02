import React from 'react';
import { FullWidthLayout } from './full-width-layout';
import { useAuthGuardRedirect } from './use-auth-guard-redirect';

/**
 * Authenticated route guard that renders its children at full viewport width.
 *
 * Applies the same onboarding / unlock checks as {@link RequireAuthenticated}
 * (via the shared {@link useAuthGuardRedirect} hook) but renders
 * {@link FullWidthLayout} instead of `RootLayout`, bypassing the popup
 * max-width constraint for expanded experiences.
 */
export const RequireAuthenticatedFullWidth = () => {
  const redirect = useAuthGuardRedirect();
  return redirect ?? <FullWidthLayout />;
};
