import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useSelector, useStore } from 'react-redux';
import type { PerpsController } from '@metamask/perps-controller';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import {
  getPerpsController,
  isPerpsControllerInitializationCancelledError,
} from './getPerpsController';
import { getPerpsStreamManager } from './PerpsStreamManager';

/**
 * Context for the PerpsController instance.
 * Provides direct access to the controller for streaming hooks and components.
 */
const PerpsControllerContext = createContext<PerpsController | null>(null);

/**
 * Props for PerpsControllerProvider
 */
export type PerpsControllerProviderProps = {
  children: ReactNode;
  /** Optional pre-initialized controller for testing */
  controller?: PerpsController;
  /** Fallback UI to show while controller is initializing */
  loadingFallback?: ReactNode;
};

/**
 * Provider component for PerpsController.
 *
 * Wrap your Perps UI components with this provider to enable
 * direct controller access for real-time data subscriptions.
 *
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @param props.controller - Optional pre-initialized controller for testing
 * @param props.loadingFallback - Fallback UI to show while controller is initializing
 * @example
 * ```tsx
 * <PerpsControllerProvider>
 *   <PerpsHomePage />
 * </PerpsControllerProvider>
 * ```
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function PerpsControllerProvider({
  children,
  controller: providedController,
  loadingFallback = null,
}: PerpsControllerProviderProps): JSX.Element | null {
  const [controller, setController] = useState<PerpsController | null>(
    providedController ?? null,
  );
  const [error, setError] = useState<Error | null>(null);

  const store = useStore();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;

  useEffect(() => {
    // If a controller was provided, skip initialization
    if (providedController) {
      setController(providedController);
      return;
    }

    // Wait for a selected address before initializing
    if (!selectedAddress) {
      return;
    }

    let isMounted = true;

    getPerpsController(selectedAddress, store)
      .then((ctrl) => {
        if (isMounted) {
          setController(ctrl);
        }
      })
      .catch((err) => {
        if (isMounted) {
          if (isPerpsControllerInitializationCancelledError(err)) {
            return;
          }

          console.error(
            '[PerpsControllerProvider] Initialization failed:',
            err,
          );
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [providedController, selectedAddress, store]);

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

  // Show loading state
  if (!controller) {
    return loadingFallback as JSX.Element | null;
  }

  return (
    <PerpsControllerContext.Provider value={controller}>
      {children}
    </PerpsControllerContext.Provider>
  );
}

/**
 * Hook to access the PerpsController directly.
 *
 * Can be used either:
 * - Within a PerpsControllerProvider (traditional pattern)
 * - Standalone with the stream manager (new pattern - requires stream manager to be initialized)
 *
 * For best results with caching and smooth navigation, prefer using the stream hooks
 * (usePerpsLivePositions, usePerpsLiveOrders, etc.) which use the PerpsStreamManager.
 *
 * @returns The PerpsController instance
 * @throws Error if controller is not available
 * @example
 * ```tsx
 * function AccountBalance() {
 *   const controller = usePerpsController();
 *
 *   useEffect(() => {
 *     const unsubscribe = controller.subscribeToAccount({
 *       callback: (account) => console.log('Balance:', account.totalBalance),
 *     });
 *     return unsubscribe;
 *   }, [controller]);
 * }
 * ```
 */
export function usePerpsController(): PerpsController {
  const contextController = useContext(PerpsControllerContext);
  const [streamManagerController, setStreamManagerController] =
    useState<PerpsController | null>(null);

  // Get the selected account address from Redux (for stream manager initialization)
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;

  useEffect(() => {
    // If we have a context controller, use that (backward compatibility)
    if (contextController) {
      return;
    }

    // Otherwise, try to get controller via stream manager
    if (!selectedAddress) {
      return;
    }

    let isMounted = true;

    const streamManager = getPerpsStreamManager();

    // Initialize stream manager if needed
    streamManager
      .init(selectedAddress)
      .then(() => {
        // Get controller via getPerpsController (stream manager uses same singleton)
        return getPerpsController(selectedAddress);
      })
      .then((ctrl) => {
        if (isMounted) {
          setStreamManagerController(ctrl);
        }
      })
      .catch((err) => {
        if (isMounted) {
          if (isPerpsControllerInitializationCancelledError(err)) {
            return;
          }

          console.error('[usePerpsController] Init failed:', err);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [contextController, selectedAddress]);

  // Prefer context controller, fall back to stream manager controller
  const controller = contextController ?? streamManagerController;

  if (!controller) {
    throw new Error(
      'usePerpsController: Controller not available. Either:\n' +
        '1. Wrap your component tree with <PerpsControllerProvider>, or\n' +
        '2. Ensure the PerpsStreamManager is initialized (call prewarm() first).',
    );
  }

  return controller;
}

// Export context for advanced use cases
export { PerpsControllerContext };
