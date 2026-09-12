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
import {
  getPerpsStreamManager,
  type PerpsStreamManager,
} from '../../../providers/perps/PerpsStreamManager';
import {
  getIsPerpsTerminalBackendEnabled,
  getIsPerpsExperienceAvailable,
} from '../../../selectors/perps';
import {
  getSelectedEvmInternalAccount,
  selectEvmAddress,
  getUseExternalServices,
} from '../../../selectors';

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
  // The background Perps session uses the EVM account, even on BTC assets.
  const selectedEvmAddress = useSelector(selectEvmAddress);
  const lastEvmAccount = useSelector(getSelectedEvmInternalAccount);
  const selectedAddress = selectedEvmAddress ?? lastEvmAccount?.address ?? null;
  const useTerminalApi = useSelector(getIsPerpsTerminalBackendEnabled);
  const useExternalServices = useSelector(getUseExternalServices);
  const available = useSelector(getIsPerpsExperienceAvailable);
  const enabled = available && useExternalServices;

  const streamManager = getPerpsStreamManager();
  // Configure the singleton before any dependent hook reads its market cache.
  // Discover is outside PerpsLayout, where this is otherwise configured, so
  // this prevents a direct-provider cache from being used while Terminal is on.
  streamManager.setUseTerminalApi(useTerminalApi);

  // Track whether streamManager is ready for this address.
  // Initialize synchronously in case init was already done by a previous call
  const [isReady, setIsReady] = useState(
    () =>
      selectedAddress !== null && streamManager.isInitialized(selectedAddress),
  );
  const [error, setError] = useState<Error | null>(() =>
    selectedAddress ? null : new Error('No account selected'),
  );
  // Start unset so the first address (including null) syncs on mount.
  const [prevSelectedAddress, setPrevSelectedAddress] = useState<
    string | null | undefined
  >(undefined);
  const [prevEnabled, setPrevEnabled] = useState(enabled);

  if (selectedAddress !== prevSelectedAddress || enabled !== prevEnabled) {
    setPrevSelectedAddress(selectedAddress);
    setPrevEnabled(enabled);
    if (!selectedAddress) {
      setIsReady(false);
      setError(new Error('No account selected'));
    } else if (!enabled) {
      setIsReady(false);
      setError(
        new Error(
          available
            ? 'Perps requires Basic Functionality'
            : 'Perps is unavailable',
        ),
      );
    } else if (streamManager.isInitialized(selectedAddress)) {
      setIsReady(true);
      setError(null);
    } else {
      setIsReady(false);
      setError(null);
    }
  }

  useEffect(() => {
    if (!selectedAddress || !enabled) {
      return undefined;
    }

    let cancelled = false;

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
  }, [selectedAddress, streamManager, enabled]);

  return {
    streamManager: isReady ? streamManager : null,
    isInitializing: !isReady && !error && selectedAddress !== null,
    error,
    selectedAddress,
  };
}
