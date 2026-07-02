import React from 'react';
import { RootLayout } from './root-layout';
import { useAuthGuardRedirect } from './use-auth-guard-redirect';

export const RequireAuthenticated = () => {
  const redirect = useAuthGuardRedirect();
  return redirect ?? <RootLayout />;
};
