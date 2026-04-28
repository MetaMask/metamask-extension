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
  // Get the selected account address from Redux
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address ?? null;

  const streamManager = getPerpsStreamManager();

  // Track whether streamManager is ready for this address.
  // Initialize synchronously in case init was already done by a previous call
  const [isReady, setIsReady] = useState(
    () =>
      selectedAddress !== null && streamManager.isInitialized(selectedAddress),
  );
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!selectedAddress) {
      setIsReady(false);
      setError(new Error('No account selected'));
      return undefined;
    }

    // Already initialized by a previous call
    if (streamManager.isInitialized(selectedAddress)) {
      setIsReady(true);
      setError(null);
      return undefined;
    }

    let cancelled = false;

    setIsReady(false);
    setError(null);

    // initForAddress deduplicates: multiple hooks sharing this singleton
    // only trigger a single perpsInit RPC + channel reset round-trip.
    streamManager
      .initForAddress(selectedAddress)
      .then(() => {
        if (cancelled) {
          return;
        }
        setIsReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        console.error('[usePerpsStreamManager] Init failed:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      });

    return () => {
      cancelled = true;
    };
  }, [selectedAddress, streamManager]);

  return {
    streamManager: isReady ? streamManager : null,
    isInitializing: !isReady && !error && selectedAddress !== null,
    error,
    selectedAddress,
  };
}
