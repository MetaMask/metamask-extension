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
import { submitRequestToBackground } from '../../store/background-connection';
import {
  getPerpsControllerFacade,
  getPerpsStreamingController,
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
}: Readonly<PerpsControllerProviderProps>): JSX.Element | null {
  const [controller, setController] = useState<PerpsController | null>(
    () => providedController ?? getPerpsControllerFacade(),
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

    const streamManager = getPerpsStreamManager();
    let isMounted = true;

    // Background controller is the single init authority.
    // UI streaming controller is created only after background init succeeds.
    submitRequestToBackground('perpsInit')
      .then(() => getPerpsStreamingController(selectedAddress, store))
      .then((ctrl) => {
        if (!isMounted) {
          return;
        }
        setController(ctrl);
        setError(null);
        return streamManager.init(selectedAddress);
      })
      .then(() => {
        if (isMounted) {
          streamManager.prewarm();
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
      streamManager.cleanupPrewarm();
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
 * Must be used within a PerpsControllerProvider. For best results with caching
 * and smooth navigation, prefer the stream hooks (usePerpsLivePositions,
 * usePerpsLiveOrders, etc.) which use the PerpsStreamManager.
 *
 * @returns The PerpsController instance
 * @throws Error if used outside PerpsControllerProvider
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
  const controller = useContext(PerpsControllerContext);
  if (!controller) {
    throw new Error(
      'usePerpsController must be used within a <PerpsControllerProvider>',
    );
  }
  return controller;
}

// Export context for advanced use cases
export { PerpsControllerContext };
