import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom-v5-compat';
import { UNLOCK_ROUTE, ONBOARDING_ROUTE } from '../../constants/routes';

type AuthenticatedV5CompatProps = {
  children: React.ReactNode;
};

/**
 * AuthenticatedV5Compat - A wrapper component for v5-compat routes that require authentication
 *
 * This component checks if the user is unlocked and has completed onboarding.
 * If not, it redirects to the appropriate route using v5-compat Navigate.
 *
 * Unlike the v5 Authenticated HOC, this returns the element directly (not wrapped in Route)
 * because v5-compat Routes handle their children differently.
 *
 * @param props - Component props
 * @param props.children - Child components to render when authenticated
 * @returns Navigate component or children
 */
const AuthenticatedV5Compat = ({ children }: AuthenticatedV5CompatProps) => {
  const location = useLocation();
  const isUnlocked = useSelector(
    (state: { metamask: { isUnlocked: boolean } }) => state.metamask.isUnlocked,
  );
  const completedOnboarding = useSelector(
    (state: { metamask: { completedOnboarding: boolean } }) =>
      state.metamask.completedOnboarding,
  );

  if (!completedOnboarding) {
    return <Navigate to={ONBOARDING_ROUTE} replace />;
  }

  if (!isUnlocked) {
    return <Navigate to={UNLOCK_ROUTE} replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default AuthenticatedV5Compat;
