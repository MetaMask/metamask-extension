import React, { type ReactNode, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import { getPerpsStreamManager } from './PerpsStreamManager';
import { isPerpsControllerInitializationCancelledError } from './getPerpsController';

/**
 * Props for PerpsRouteWrapper
 */
export type PerpsRouteWrapperProps = {
  children: ReactNode;
  /** Optional fallback UI while initializing */
  loadingFallback?: ReactNode;
};

/**
 * Route-level wrapper for Perps pages.
 *
 * Initializes the PerpsStreamManager and calls prewarm() to keep data
 * cached across navigation. This enables smooth navigation without
 * loading skeletons when moving between Perps views.
 *
 * Key responsibilities:
 * - Initialize stream manager on mount
 * - Start prewarming to keep cache fresh
 * - Cleanup prewarm on unmount (but cache persists!)
 *
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @param props.loadingFallback - Optional fallback UI while initializing
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
  loadingFallback = null,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get the selected account address from Redux
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;

  useEffect(() => {
    if (!selectedAddress) {
      setError(new Error('No account selected'));
      return;
    }

    const streamManager = getPerpsStreamManager();

    // Initialize stream manager for this address
    streamManager
      .init(selectedAddress)
      .then(() => {
        setIsInitialized(true);
        setError(null);

        // Start prewarming to keep cache fresh
        // This keeps WebSocket subscriptions alive while in Perps
        streamManager.prewarm();
      })
      .catch((err: unknown) => {
        if (isPerpsControllerInitializationCancelledError(err)) {
          return;
        }

        console.error('[PerpsRouteWrapper] Init failed:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      });

    // Cleanup prewarm on unmount
    // Note: Cache persists, only subscriptions are cleaned up
    return () => {
      streamManager.cleanupPrewarm();
    };
  }, [selectedAddress]);

  // Show error state
  if (error) {
    return (
      <div
        style={{
          padding: '16px',
          color: 'var(--color-error-default)',
          textAlign: 'center',
        }}
      >
        Failed to initialize Perps: {error.message}
      </div>
    );
  }

  // Show loading state while initializing
  // Note: If we have cached data from previous navigation, children can
  // render immediately with cached data (no loading skeleton!)
  if (!isInitialized) {
    // Check if stream manager already has cached data
    const streamManager = getPerpsStreamManager();
    const hasCachedData =
      streamManager.positions.hasCachedData() ||
      streamManager.orders.hasCachedData() ||
      streamManager.account.hasCachedData();

    // If we have cached data, render children immediately
    // (they'll use cached data while fresh data loads)
    if (hasCachedData) {
      return <>{children}</>;
    }

    return loadingFallback as JSX.Element | null;
  }

  return <>{children}</>;
};
