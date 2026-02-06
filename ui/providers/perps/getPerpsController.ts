import { Messenger } from '@metamask/messenger';
import {
  PerpsController,
  getDefaultPerpsControllerState,
  createPerpsInfrastructure,
  type PerpsControllerState,
  type PerpsControllerMessenger,
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../app/scripts/controllers/perps';

/**
 * Singleton instance of the PerpsController.
 * Uses the real @metamask/perps-controller package.
 */
let controllerInstance: PerpsController | null = null;

/**
 * The address the current controller instance was initialized with.
 * Used to detect account switches and reinitialize.
 */
let currentAddress: string | null = null;

/**
 * Promise to track initialization to prevent race conditions.
 */
let initPromise: Promise<PerpsController> | null = null;

/**
 * Create a standalone messenger for the PerpsController (PoC).
 *
 * In production, this should be a restricted messenger from the
 * root MetaMaskController messenger with access to:
 * - NetworkController actions
 * - AuthenticationController actions
 * - RemoteFeatureFlagController state
 *
 * For the PoC, we create a standalone messenger that won't have
 * access to other controllers, but can still work for basic
 * balance fetching via direct provider access.
 */
function createPerpsMessenger(): PerpsControllerMessenger {
  // For the PoC, create a simple messenger with the PerpsController namespace.
  // This won't have cross-controller communication but is sufficient for
  // testing balance fetching via the provider's WebSocket/HTTP clients.
  const messenger = new Messenger({
    namespace: 'PerpsController',
  }) as PerpsControllerMessenger;

  return messenger;
}

/**
 * Get the PerpsController instance.
 * Returns a singleton PerpsController that is initialized on first access.
 *
 * @param selectedAddress - The currently selected account address
 * @returns Promise resolving to the PerpsController instance
 * @example
 * ```typescript
 * const controller = await getPerpsController(selectedAccount.address);
 * const account = await controller.getAccountState();
 * console.log('Balance:', account.totalBalance);
 * ```
 */
export async function getPerpsController(
  selectedAddress: string,
): Promise<PerpsController> {
  if (!selectedAddress) {
    throw new Error(
      'No account selected. Please select an account before using Perps.',
    );
  }

  // Check if we need to reinitialize due to account switch
  const addressChanged =
    currentAddress !== null && currentAddress !== selectedAddress;

  if (addressChanged && controllerInstance) {
    console.log(
      '[Perps] Account changed, reinitializing controller:',
      currentAddress,
      '->',
      selectedAddress,
    );
    // Disconnect the old controller
    await controllerInstance.disconnect();
    controllerInstance = null;
    initPromise = null;
  }

  // Return existing controller if address hasn't changed
  if (controllerInstance && currentAddress === selectedAddress) {
    return controllerInstance;
  }

  // Prevent race conditions during initialization
  if (!initPromise) {
    initPromise = (async () => {
      const messenger = createPerpsMessenger();
      const infrastructure = createPerpsInfrastructure(selectedAddress);

      const controller = new PerpsController({
        messenger,
        state: getDefaultPerpsControllerState(),
        infrastructure,
        // Enable HIP-3 markets (stocks, commodities like SILVER)
        clientConfig: {
          fallbackHip3Enabled: true,
          fallbackHip3AllowlistMarkets: [], // Empty = allow all HIP-3 markets
        },
      });

      // Initialize the controller (connects to Hyperliquid)
      await controller.init();

      controllerInstance = controller;
      currentAddress = selectedAddress;
      return controller;
    })();
  }

  return initPromise;
}

/**
 * Reset the controller instance (useful for testing or account switch).
 */
export async function resetPerpsController(): Promise<void> {
  if (controllerInstance) {
    await controllerInstance.disconnect();
    controllerInstance = null;
    initPromise = null;
    currentAddress = null;
  }
}

// Re-export types for convenience
export type { PerpsControllerState };
