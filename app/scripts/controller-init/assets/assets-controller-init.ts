import {
  AssetsController,
  initMessengers,
  initDataSources,
  type DataSources,
  type DataSourceMessengers,
} from '@metamask/assets-controller';
import { createApiPlatformClient, type ApiPlatformClient } from '@metamask/core-backend';
import { ControllerInitFunction } from '../types';
import {
  AssetsControllerMessenger,
  AssetsControllerInitMessenger,
} from '../messengers/assets/assets-controller-messenger';

// Store references to initialized data sources
let dataSources: DataSources | null = null;
let dataSourceMessengers: DataSourceMessengers | null = null;
let apiClient: ApiPlatformClient | null = null;

/**
 * Initialize data sources on the root messenger.
 * This MUST be called AFTER the AssetsController is created because
 * data sources call AssetsController:activeChainsUpdate during initialization,
 * and that handler is registered by the AssetsController constructor.
 *
 * @param controllerMessenger - The controller messenger (used to get root messenger).
 * @param initMessenger - The init messenger for getting bearer tokens.
 */
function initializeDataSources(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controllerMessenger: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initMessenger: any,
): void {
  if (dataSources) {
    console.log('[AssetsController] Data sources already initialized');
    return;
  }

  console.log('[AssetsController] Initializing data sources...');

  // Get the root messenger from the controller messenger
  const rootMessenger =
    controllerMessenger.parent ||
    controllerMessenger._parent ||
    controllerMessenger;

  try {
    // Create data source messengers first
    dataSourceMessengers = initMessengers({
      messenger: rootMessenger,
    });
    console.log('[AssetsController] Data source messengers created');

    // Create API client for data sources
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
    console.log('[AssetsController] API client created');

    // Create a snap provider that delegates to SnapController
    const snapProvider = {
      async request<ResponseType>(args: {
        method: string;
        params?: unknown;
      }): Promise<ResponseType> {
        try {
          const result = await initMessenger.call(
            'SnapController:handleRequest',
            {
              snapId: 'npm:@metamask/solana-wallet-snap',
              origin: 'metamask',
              handler: 'onRpcRequest',
              request: {
                method: args.method,
                params: args.params,
              },
            },
          );
          return result as ResponseType;
        } catch (error) {
          console.warn('[AssetsController] SnapProvider request failed:', error);
          return undefined as unknown as ResponseType;
        }
      },
    };

    // Get token detection setting from PreferencesController
    let tokenDetectionEnabled = true; // Default to true
    try {
      const preferencesState = initMessenger.call('PreferencesController:getState');
      tokenDetectionEnabled = preferencesState?.useTokenDetection ?? true;
      console.log('[AssetsController] Token detection enabled:', tokenDetectionEnabled);
    } catch (error) {
      console.warn('[AssetsController] Failed to get preferences, defaulting tokenDetection to true:', error);
    }

    // Initialize all data sources
    dataSources = initDataSources({
      messengers: dataSourceMessengers,
      snapProvider,
      queryApiClient: apiClient,
      rpcDataSourceConfig: {
        tokenDetectionEnabled,
      },
    });
    console.log(
      '[AssetsController] Data sources initialized:',
      Object.keys(dataSources),
    );
  } catch (error) {
    console.error('[AssetsController] Failed to initialize data sources:', error);
    // If initialization fails, the controller will still work with its internal state
  }
}

/**
 * Add compatibility methods to the AssetsController.
 * The package has a different API than what metamask-controller.js expects.
 * This adds polling methods that wrap the new subscription-based API.
 *
 * @param controller - The AssetsController instance to extend.
 */
function addCompatibilityMethods(
  controller: AssetsController,
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

      // Mark as started - the controller manages its own subscriptions
      // via the messenger events it's subscribed to
      if (!isStarted && activePollingTokens.size === 1) {
        isStarted = true;
        console.log('[AssetsController] Polling started');
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

      // Mark as stopped when no more active polling tokens
      if (activePollingTokens.size === 0 && isStarted) {
        isStarted = false;
        console.log('[AssetsController] Polling stopped');
      }
    };
  }

  // Add stopAllPolling method if not present
  if (!controllerAny.stopAllPolling) {
    controllerAny.stopAllPolling = (): void => {
      console.log('[AssetsController] stopAllPolling called');
      activePollingTokens.clear();
      isStarted = false;
      console.log('[AssetsController] All polling stopped');
    };
  }
}

/**
 * Initialize the AssetsController.
 *
 * The AssetsController uses event-driven subscriptions internally.
 * Data sources are initialized AFTER the controller is created because:
 * 1. The controller registers AssetsController:activeChainsUpdate in its constructor
 * 2. Data sources call this action during their initialization
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

  // Step 1: Create the AssetsController
  // This registers action handlers including AssetsController:activeChainsUpdate
  console.log('[AssetsController] Creating AssetsController instance...');
  const controller = new AssetsController({
    messenger: controllerMessenger,
    state: persistedState.AssetsController,
  });
  console.log('[AssetsController] AssetsController instance created');

  // Step 2: Initialize data sources AFTER the controller is created
  // Data sources need AssetsController:activeChainsUpdate to be registered
  initializeDataSources(controllerMessenger, initMessenger);

  // Step 3: Add compatibility methods for polling API
  addCompatibilityMethods(controller);
  console.log('[AssetsController] Compatibility methods added');

  return {
    controller,
  };
};
