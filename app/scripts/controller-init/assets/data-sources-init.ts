import {
  initMessengers,
  initDataSources,
  type DataSourceMessengers,
  type DataSources,
  type DataSourceAllowedActions,
  type DataSourceAllowedEvents,
  type RootMessenger,
  type SnapProvider,
} from '@metamask/assets-controller';
import { ApiPlatformClient } from '@metamask/core-backend';
import { HandlerType } from '@metamask/snaps-utils';
import type {
  DataSourceMessenger,
  DataSourceInitMessenger,
} from '../messengers/assets';
import type { ControllerInitFunction } from '../types';

// ============================================================================
// SNAP PROVIDER
// ============================================================================

/**
 * Creates a snap provider that uses MetaMask's snap infrastructure.
 *
 * This provider uses the SnapController's handleRequest method to communicate
 * with installed snaps. It supports:
 * - wallet_getSnaps: Returns all installed snaps
 * - wallet_invokeSnap: Invokes a snap's RPC handler
 */
function createSnapProvider(
  getController: (name: string) => unknown,
): SnapProvider {
  return {
    request: async <T>(args: { method: string; params?: unknown }): Promise<T> => {
      // Get the snap controller
      const snapController = getController('SnapController');
      if (!snapController) {
        throw new Error('SnapController not available');
      }

      // For wallet_getSnaps - return all installed snaps from state
      if (args.method === 'wallet_getSnaps') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const controller = snapController as any;

        // Access state.snaps which contains all installed snaps
        const snaps = controller.state?.snaps ?? {};

        // Transform to the expected format: { snapId: { version: string } }
        const result: Record<string, { version: string }> = {};
        for (const [snapId, snap] of Object.entries(snaps)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const snapData = snap as any;
          // Only include enabled, non-blocked snaps
          if (snapData.enabled && !snapData.blocked) {
            result[snapId] = { version: snapData.version };
          }
        }

        return result as T;
      }

      // For wallet_invokeSnap - use handleRequest with proper origin
      if (args.method === 'wallet_invokeSnap') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params = args.params as any;
        const { snapId, request } = params;

        // Use handleRequest which is the internal API for calling snaps
        // The origin 'metamask' is allowed for keyring methods
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (snapController as any).handleRequest({
          snapId,
          origin: 'metamask',
          handler: HandlerType.OnKeyringRequest, // Use keyring handler for keyring methods
          request: {
            jsonrpc: '2.0',
            id: Date.now().toString(),
            method: request.method,
            params: request.params,
          },
        });

        return result as T;
      }

      throw new Error(`Unsupported method: ${args.method}`);
    },
  };
}

// ============================================================================
// TYPES
// ============================================================================

export interface InitDataSourcesResult {
  messengers: DataSourceMessengers;
  dataSources: DataSources;
}

export interface InitDataSourcesParams {
  /** The root controller messenger */
  messenger: RootMessenger<DataSourceAllowedActions, DataSourceAllowedEvents>;
  /** Init messenger for getting bearer token */
  initMessenger: DataSourceInitMessenger;
  /** Function to get a controller by name (for SnapProvider) */
  getController: (name: string) => unknown;
}

// ============================================================================
// INIT FUNCTION
// ============================================================================

/**
 * Initialize all data sources and their messengers.
 *
 * This is the main entry point for initializing the data source infrastructure.
 * It creates all child messengers with proper action/event delegation, then
 * instantiates all data source classes.
 *
 * Data sources initialized:
 * - RpcDataSource: Direct blockchain RPC queries (fallback)
 * - BackendWebsocketDataSource: Real-time WebSocket updates
 * - AccountsApiDataSource: MetaMask Accounts API
 * - SnapDataSource: Snap-based chains (Solana, Bitcoin, Tron)
 * - TokenDataSource: Token metadata enrichment
 * - PriceDataSource: Asset price fetching
 * - DetectionMiddleware: New asset detection
 *
 * @example
 * ```typescript
 * import { initAllDataSources } from './data-sources-init';
 *
 * const { messengers, dataSources } = initAllDataSources({
 *   messenger: controllerMessenger,
 *   getController,
 * });
 * ```
 *
 * @param params - Initialization parameters
 * @returns Object containing all messengers and data source instances
 */
export function initAllDataSources(
  params: InitDataSourcesParams,
): InitDataSourcesResult {
  const { messenger, initMessenger, getController } = params;

  // Step 1: Initialize all child messengers with proper delegation
  const messengers = initMessengers({ messenger });

  // Step 2: Create snap provider
  const snapProvider = createSnapProvider(getController);

  // Step 3: Create ApiPlatformClient with caching
  const apiClient = new ApiPlatformClient({
    clientProduct: 'metamask-extension',
    getBearerToken: async () => {
      try {
        return await initMessenger.call(
          'AuthenticationController:getBearerToken',
        );
      } catch {
        // User not signed in
        return undefined;
      }
    },
  });

  // Step 3b: Subscribe to auth state changes to invalidate cached token
  initMessenger.subscribe('AuthenticationController:stateChange', () => {
    // Invalidate the cached bearer token when auth state changes (login/logout)
    apiClient.invalidateAuthToken();
  });

  // Step 4: Initialize all data sources
  const dataSources = initDataSources({
    messengers,
    snapProvider,
    queryApiClient: apiClient,
  });

  return {
    messengers,
    dataSources,
  };
}

// Re-export types for convenience
export type {
  DataSourceMessengers,
  DataSources,
  DataSourceAllowedActions,
  DataSourceAllowedEvents,
  RootMessenger,
};

// ============================================================================
// CONTROLLER INIT FUNCTION
// ============================================================================

/**
 * Controller init function for data sources.
 *
 * This follows the standard controller init pattern to integrate data sources
 * into the MetaMask controller initialization flow.
 *
 * @example
 * ```typescript
 * // In metamask-controller.js controllerInitFunctions:
 * DataSource: DataSourceInit,
 * ```
 */
export const DataSourceInit: ControllerInitFunction<
  DataSources,
  DataSourceMessenger,
  DataSourceInitMessenger
> = ({ controllerMessenger, initMessenger, getController }) => {
  const { dataSources } = initAllDataSources({
    messenger: controllerMessenger as RootMessenger<
      DataSourceAllowedActions,
      DataSourceAllowedEvents
    >,
    initMessenger,
    getController,
  });

  return {
    controller: dataSources,
    // Data sources have no persisted state
    persistedStateKey: null,
    // Data sources have no memory state to sync
    memStateKey: null,
  };
};

