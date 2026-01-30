import React, { type ReactNode } from 'react';
import { PerpsStreamProvider } from './PerpsStreamProvider';

/**
 * Props for PerpsRouteWrapper
 */
export interface PerpsRouteWrapperProps {
  children: ReactNode;
}

/**
 * Route-level wrapper for Perps pages
 *
 * Provides the PerpsStreamManager context to all Perps routes.
 * The stream manager persists across page navigation within Perps,
 * avoiding recreation when switching between home, detail, and list pages.
 *
 * @example
 * ```tsx
 * // In routes config
 * createRouteWithLayout({
 *   path: PERPS_HOME_ROUTE,
 *   component: () => (
 *     <PerpsRouteWrapper>
 *       <PerpsHomePage />
 *     </PerpsRouteWrapper>
 *   ),
 *   layout: RootLayout,
 *   authenticated: true,
 * })
 * ```
 */
export const PerpsRouteWrapper: React.FC<PerpsRouteWrapperProps> = ({
  children,
}) => {
  return <PerpsStreamProvider>{children}</PerpsStreamProvider>;
};
