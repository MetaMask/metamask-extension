import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom-v5-compat';
import { getCompletedOnboarding } from '../../../ducks/metamask/metamask';
import { ONBOARDING_ROUTE } from '../../constants/routes';

type InitializedV5CompatProps = {
  children: React.ReactNode;
};

/**
 * InitializedV5Compat - A wrapper component for v5-compat routes that require initialization
 *
 * This component checks if the user has completed onboarding.
 * If not, it redirects to the onboarding route using v5-compat Navigate.
 *
 * Unlike the v5 Initialized HOC, this returns the element directly (not wrapped in Route)
 * because v5-compat Routes handle their children differently.
 *
 * @param props - Component props
 * @param props.children - Child components to render when initialized
 * @returns Navigate component or children
 */
const InitializedV5Compat = ({ children }: InitializedV5CompatProps) => {
  const completedOnboarding = useSelector(getCompletedOnboarding);

  if (!completedOnboarding) {
    return <Navigate to={ONBOARDING_ROUTE} replace />;
  }

  return <>{children}</>;
};

export default InitializedV5Compat;
