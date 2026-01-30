import { AssetsController } from '@metamask/assets-controller';
import { createApiPlatformClient, ApiPlatformClient } from '@metamask/core-backend';
import { ControllerInitFunction } from '../types';
import {
  AssetsControllerMessenger,
  AssetsControllerInitMessenger,
} from '../messengers/assets/assets-controller-messenger';

let apiClient: ApiPlatformClient | null = null;

/**
 * Add compatibility methods to the AssetsController.
 * The yalc package has a different API than what metamask-controller.js expects.
 * This adds polling methods that wrap the new subscription-based API.
 *
 * @param controller - The AssetsController instance to extend.
 * @param controllerMessenger - The controller messenger for accessing other controllers.
 */
function addCompatibilityMethods(
  controller: AssetsController,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _controllerMessenger: any,
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controllerAny = controller as any;

  // Track active polling tokens (controller starts on KeyringController:unlock)
  const activePollingTokens = new Set<string>();

  // Add startPolling method if not present
  if (!controllerAny.startPolling) {
    controllerAny.startPolling = (options?: {
      networkClientId?: string;
    }): string => {
      console.log('[AssetsController] startPolling called', options);

      const pollingToken = `assets-polling-${Date.now()}`;
      activePollingTokens.add(pollingToken);

      return pollingToken;
    };
  }

  // Add stopPollingByPollingToken method if not present
  if (!controllerAny.stopPollingByPollingToken) {
    controllerAny.stopPollingByPollingToken = (pollingToken: string): void => {
      console.log(
        '[AssetsController] stopPollingByPollingToken called',
        pollingToken,
      );

      activePollingTokens.delete(pollingToken);
    };
  }

  // Add stopAllPolling method if not present
  if (!controllerAny.stopAllPolling) {
    controllerAny.stopAllPolling = (): void => {
      console.log('[AssetsController] stopAllPolling called');
      activePollingTokens.clear();
    };
  }
}

/**
 * Initialize the AssetsController.
 *
 * The controller creates and owns its own data sources (BackendWebsocket,
 * AccountsApi, Snap, RPC, Price, Token, DetectionMiddleware) when given
 * queryApiClient. No separate initDataSources or initMessengers is used.
 *
 * Lifecycle:
 * - Starts on KeyringController:unlock
 * - Stops on KeyringController:lock
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger - The init messenger for accessing initialization actions.
 * @returns The initialized controller.
 */
export const AssetsControllerInit: ControllerInitFunction<
  AssetsController,
  AssetsControllerMessenger,
  AssetsControllerInitMessenger
> = ({ controllerMessenger, persistedState, initMessenger }) => {
  console.log('[AssetsController] Initializing...');

  // Create the API Platform Client; the controller uses it for its data sources
  console.log('[AssetsController] Creating ApiPlatformClient...');
  try {
    apiClient = createApiPlatformClient({
      clientProduct: 'metamask-extension',
      getBearerToken: async () => {
        try {
          const token = await initMessenger.call(
            'AuthenticationController:getBearerToken',
          );
          return token;
        } catch (error) {
          console.warn('[AssetsController] Failed to get bearer token:', error);
          return undefined;
        }
      },
    });
    console.log('[AssetsController] ApiPlatformClient created');
  } catch (error) {
    console.error('[AssetsController] Failed to create ApiPlatformClient:', error);
    throw error;
  }

  // Create the AssetsController; it instantiates all data sources internally
  console.log('[AssetsController] Creating AssetsController instance...');
  const controller = new AssetsController({
    messenger: controllerMessenger,
    state: persistedState.AssetsController,
    queryApiClient: apiClient,
  });
  console.log('[AssetsController] AssetsController instance created');

  // Add compatibility methods for metamask-controller.js integration
  console.log('[AssetsController] Adding compatibility methods...');
  addCompatibilityMethods(controller, controllerMessenger);
  console.log('[AssetsController] Compatibility methods added');

  return {
    controller,
  };
};
