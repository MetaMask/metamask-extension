/**
 * Hook for accessing the PerpsStreamManager with proper initialization
 *
 * This hook:
 * - Gets the selected address from Redux
 * - Initializes the stream manager for that address
 * - Returns the manager when ready
 *
 * Used by all stream hooks as a common initialization point.
 */

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getSelectedInternalAccount } from '../../../selectors/accounts';
import {
  getPerpsStreamManager,
  type PerpsStreamManager,
} from '../../../providers/perps/PerpsStreamManager';

export type UsePerpsStreamManagerReturn = {
  /** The stream manager instance (null while initializing) */
  streamManager: PerpsStreamManager | null;
  /** Whether the stream manager is being initialized */
  isInitializing: boolean;
  /** Error if initialization failed */
  error: Error | null;
  /** The selected account address */
  selectedAddress: string | null;
};

/**
 * Hook for accessing the PerpsStreamManager with automatic initialization.
 *
 * The stream manager is a module-level singleton that:
 * - Caches data across navigation within Perps
 * - Provides immediate cached data on subscribe (BehaviorSubject pattern)
 * - Reinitializes on account switch
 *
 * @returns Object with stream manager and initialization state
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { streamManager, isInitializing } = usePerpsStreamManager();
 *
 *   if (isInitializing || !streamManager) {
 *     return <Loading />;
 *   }
 *
 *   // Use streamManager.positions.subscribe(), etc.
 * }
 * ```
 */
export function usePerpsStreamManager(): UsePerpsStreamManagerReturn {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Get the selected account address from Redux
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address ?? null;

  const streamManager = getPerpsStreamManager();

  useEffect(() => {
    if (!selectedAddress) {
      setIsInitializing(false);
      setError(new Error('No account selected'));
      setIsReady(false);
      return;
    }

    // Check if already initialized for this address
    if (streamManager.isInitialized(selectedAddress)) {
      setIsInitializing(false);
      setError(null);
      setIsReady(true);
      return;
    }

    // Initialize
    setIsInitializing(true);
    setError(null);
    setIsReady(false);

    streamManager
      .init(selectedAddress)
      .then(() => {
        setIsInitializing(false);
        setIsReady(true);
      })
      .catch((err: unknown) => {
        console.error('[usePerpsStreamManager] Init failed:', err);
        setIsInitializing(false);
        setError(err instanceof Error ? err : new Error(String(err)));
      });
  }, [selectedAddress, streamManager]);

  return {
    streamManager: isReady ? streamManager : null,
    isInitializing,
    error,
    selectedAddress,
  };
}
