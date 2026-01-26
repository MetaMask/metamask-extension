import {
  AssetsController,
  initMessengers,
  initDataSources,
  type SnapProvider,
  type DataSources,
  type DataSourceMessengers,
} from '@metamask/assets-controller';
import { createApiPlatformClient, ApiPlatformClient } from '@metamask/core-backend';
import { ControllerInitFunction } from '../types';
import {
  AssetsControllerMessenger,
  AssetsControllerInitMessenger,
} from '../messengers/assets/assets-controller-messenger';

// Store references to data sources for cleanup
let dataSources: DataSources | null = null;
let apiClient: ApiPlatformClient | null = null;

/**
 * Trigger the internal start flow by publishing the appOpened event.
 * The AssetsController listens for this event to start subscriptions.
 *
 * @param controllerMessenger - The controller messenger to publish on.
 */
function triggerStart(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controllerMessenger: any,
): void {
  try {
    // Publish appOpened event to trigger the controller's _start() method
    // which subscribes to all data sources
    console.log('[AssetsController] Publishing appOpened event to start subscriptions...');
    controllerMessenger.publish('AppStateController:appOpened');
    console.log('[AssetsController] appOpened event published');
  } catch (error) {
    console.error('[AssetsController] Error publishing appOpened event:', error);
  }
}

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
  controllerMessenger: any,
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controllerAny = controller as any;

  // Track active polling tokens
  const activePollingTokens = new Set<string>();
  let isStarted = false;

  // Add startPolling method if not present
  if (!controllerAny.startPolling) {
    controllerAny.startPolling = (options?: {
      networkClientId?: string;
    }): string => {
      console.log('[AssetsController] startPolling called', options);

      const pollingToken = `assets-polling-${Date.now()}`;
      activePollingTokens.add(pollingToken);

      // Start subscriptions if this is the first polling request
      if (!isStarted && activePollingTokens.size === 1) {
        isStarted = true;
        // Trigger the controller's internal start flow via appOpened event
        triggerStart(controllerMessenger);
      }

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

      // Stop subscriptions if no more active polling tokens
      if (activePollingTokens.size === 0 && isStarted) {
        isStarted = false;
        try {
          // Publish appClosed event to trigger the controller's _stop() method
          controllerMessenger.publish('AppStateController:appClosed');
          console.log('[AssetsController] Stopped subscriptions via appClosed');
        } catch (error) {
          console.error(
            '[AssetsController] Error stopping subscriptions:',
            error,
          );
        }
      }
    };
  }

  // Add stopAllPolling method if not present
  if (!controllerAny.stopAllPolling) {
    controllerAny.stopAllPolling = (): void => {
      console.log('[AssetsController] stopAllPolling called');

      activePollingTokens.clear();

      if (isStarted) {
        isStarted = false;
        try {
          // Publish appClosed event to trigger the controller's _stop() method
          controllerMessenger.publish('AppStateController:appClosed');
          console.log('[AssetsController] Stopped all subscriptions via appClosed');
        } catch (error) {
          console.error(
            '[AssetsController] Error stopping subscriptions:',
            error,
          );
        }
      }
    };
  }
}

/**
 * Create a SnapProvider adapter that uses the messenger to call SnapController.
 *
 * @param initMessenger - The init messenger with access to SnapController actions.
 * @returns A SnapProvider that wraps SnapController:handleRequest.
 */
function createSnapProvider(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initMessenger: any,
): SnapProvider {
  return {
    async request<ResponseType>(args: {
      method: string;
      params?: unknown;
    }): Promise<ResponseType> {
      // Extract snap ID from the request if available
      // The SnapDataSource passes the snapId in the method name format: "{snapId}/{handler}"
      // or as a standard JSON-RPC request
      const { method, params } = args;

      // For direct snap requests, the method should be the JSON-RPC method name
      // We need to determine the correct snap ID based on the chain type
      console.log('[AssetsController] SnapProvider.request called:', { method, params });

      try {
        // The SnapDataSource will call this with the full request object
        // We delegate to SnapController:handleRequest
        const result = await initMessenger.call(
          'SnapController:handleRequest',
          {
            // Default to a generic wallet handler
            snapId: 'npm:@metamask/solana-wallet-snap',
            origin: 'metamask',
            handler: 'onRpcRequest',
            request: {
              method,
              params,
            },
          },
        );
        return result as ResponseType;
      } catch (error) {
        console.error('[AssetsController] SnapProvider request failed:', error);
        throw error;
      }
    },
  };
}

/**
 * Initialize the AssetsController with real data sources.
 *
 * The AssetsController uses event-driven subscriptions:
 * - Starts on AppStateController:appOpened or KeyringController:unlock
 * - Stops on AppStateController:appClosed or KeyringController:lock
 *
 * Data sources (BackendWebsocket, AccountsApi, Snap, Rpc) are initialized
 * using initMessengers() and initDataSources() from @metamask/assets-controller.
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
  console.log('[AssetsController] Initializing data sources...');

  // Get the root messenger from the controller messenger's parent
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rootMessenger = (controllerMessenger as any).parent ||
    (controllerMessenger as any)._parent ||
    controllerMessenger;

  // Initialize all data source messengers
  console.log('[AssetsController] Calling initMessengers...');
  let dataSourceMessengers: DataSourceMessengers;
  try {
    dataSourceMessengers = initMessengers({
      messenger: rootMessenger,
    });
    console.log('[AssetsController] Data source messengers created');
  } catch (error) {
    console.error('[AssetsController] Failed to initialize messengers:', error);
    throw error;
  }

  // Create the API Platform Client for data sources that need API access
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

  // Create the SnapProvider for SnapDataSource
  console.log('[AssetsController] Creating SnapProvider...');
  const snapProvider = createSnapProvider(initMessenger);
  console.log('[AssetsController] SnapProvider created');

  // Initialize all data sources
  console.log('[AssetsController] Calling initDataSources...');
  try {
    dataSources = initDataSources({
      messengers: dataSourceMessengers,
      snapProvider,
      queryApiClient: apiClient,
    });
    console.log('[AssetsController] Data sources initialized:', Object.keys(dataSources));
  } catch (error) {
    console.error('[AssetsController] Failed to initialize data sources:', error);
    throw error;
  }

  // Create the AssetsController
  console.log('[AssetsController] Creating AssetsController instance...');
  const controller = new AssetsController({
    messenger: controllerMessenger,
    state: persistedState.AssetsController,
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
