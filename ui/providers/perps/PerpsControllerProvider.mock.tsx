/**
 * Mock PerpsControllerProvider and usePerpsController hook
 *
 * Provides mock controller access for UI development without the actual
 * perps-controller dependency.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useSelector } from 'react-redux';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import { getPerpsController } from './getPerpsController.mock';
import type { getPerpsController as GetPerpsControllerType } from './getPerpsController.mock';

/**
 * Mock PerpsController type
 * Uses the return type of the mock getPerpsController function
 */
type MockPerpsController = Awaited<ReturnType<typeof GetPerpsControllerType>>;

/**
 * Context for the mock PerpsController instance.
 */
const PerpsControllerContext = createContext<MockPerpsController | null>(null);

/**
 * Props for PerpsControllerProvider
 */
export type PerpsControllerProviderProps = {
  children: ReactNode;
  /** Optional pre-initialized controller for testing */
  controller?: MockPerpsController;
  /** Fallback UI to show while controller is initializing */
  loadingFallback?: ReactNode;
};

/**
 * Mock Provider component for PerpsController.
 *
 * Wrap your Perps UI components with this provider to enable
 * controller access (uses mock implementation).
 *
 * @param props - Component props
 * @param props.children
 * @param props.controller
 * @param props.loadingFallback
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
  const [controller, setController] = useState<MockPerpsController | null>(
    providedController ?? null,
  );
  const [error, setError] = useState<Error | null>(null);

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
          console.error(
            '[MockPerpsControllerProvider] Initialization failed:',
            err,
          );
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
        Failed to initialize Perps (Mock): {error.message}
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
 * Mock hook to access the PerpsController.
 *
 * Returns the mock controller instance which logs operations to console
 * instead of making real API calls.
 *
 * @returns The mock PerpsController instance
 * @throws Error if controller is not available
 * @example
 * ```tsx
 * function TradingForm() {
 *   const controller = usePerpsController();
 *
 *   const handleCancelOrder = async (orderId: string) => {
 *     await controller.cancelOrder({ orderId, symbol: 'BTC' });
 *   };
 * }
 * ```
 */
export function usePerpsController(): MockPerpsController {
  const contextController = useContext(PerpsControllerContext);
  const [standaloneController, setStandaloneController] =
    useState<MockPerpsController | null>(null);

  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;

  useEffect(() => {
    // If we have a context controller, use that
    if (contextController) {
      return;
    }

    // Otherwise, get controller directly
    if (!selectedAddress) {
      return;
    }

    let isMounted = true;

    getPerpsController(selectedAddress)
      .then((ctrl) => {
        if (isMounted) {
          setStandaloneController(ctrl);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('[usePerpsController] Init failed:', err);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [contextController, selectedAddress]);

  // Prefer context controller, fall back to standalone controller
  const controller = contextController ?? standaloneController;

  if (!controller) {
    throw new Error(
      'usePerpsController: Mock controller not available. Either:\n' +
        '1. Wrap your component tree with <PerpsControllerProvider>, or\n' +
        '2. Wait for the controller to initialize.',
    );
  }

  return controller;
}

// Export context for advanced use cases
export { PerpsControllerContext };
