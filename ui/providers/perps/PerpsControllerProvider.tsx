import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useSelector } from 'react-redux';
import type { PerpsController } from '@metamask/perps-controller';
import { getPerpsController } from './getPerpsController';
import { getSelectedInternalAccount } from '../../selectors/accounts';

/**
 * Context for the PerpsController instance.
 * Provides direct access to the controller for streaming hooks and components.
 */
const PerpsControllerContext = createContext<PerpsController | null>(null);

/**
 * Props for PerpsControllerProvider
 */
export interface PerpsControllerProviderProps {
  children: ReactNode;
  /** Optional pre-initialized controller for testing */
  controller?: PerpsController;
  /** Fallback UI to show while controller is initializing */
  loadingFallback?: ReactNode;
}

/**
 * Provider component for PerpsController
 *
 * Wrap your Perps UI components with this provider to enable
 * direct controller access for real-time data subscriptions.
 *
 * @example
 * ```tsx
 * <PerpsControllerProvider>
 *   <PerpsHomePage />
 * </PerpsControllerProvider>
 * ```
 */
export function PerpsControllerProvider({
  children,
  controller: providedController,
  loadingFallback = null,
}: PerpsControllerProviderProps): JSX.Element | null {
  const [controller, setController] = useState<PerpsController | null>(
    providedController ?? null,
  );
  const [error, setError] = useState<Error | null>(null);

  // Get the selected account address from Redux
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

    getPerpsController(selectedAddress)
      .then((ctrl) => {
        if (isMounted) {
          setController(ctrl);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('[PerpsControllerProvider] Initialization failed:', err);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [providedController, selectedAddress]);

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
 * Must be used within a PerpsControllerProvider.
 *
 * @returns The PerpsController instance
 * @throws Error if used outside of PerpsControllerProvider
 *
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
      'usePerpsController must be used within a PerpsControllerProvider. ' +
        'Wrap your component tree with <PerpsControllerProvider>.',
    );
  }

  return controller;
}

// Export context for advanced use cases
export { PerpsControllerContext };
