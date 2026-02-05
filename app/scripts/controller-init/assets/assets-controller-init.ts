import {
  AssetsController,
  initMessengers,
  initDataSources,
  type DataSources,
  type DataSourceMessengers,
} from '@metamask/assets-controller';
import {
  createApiPlatformClient,
  type ApiPlatformClient,
} from '@metamask/core-backend';
import {
  isAssetsUnifyStateFeatureEnabled,
  ASSETS_UNIFY_STATE_VERSION_1,
  type AssetsUnifyStateFeatureFlag,
} from '../../../../shared/lib/assets-unify-state/remote-feature-flag';
import { type ControllerInitFunction } from '../types';
import {
  type AssetsControllerMessenger,
  type AssetsControllerInitMessenger,
} from '../messengers/assets/assets-controller-messenger';

const LOG_PREFIX = '[AssetsController]';
const ASSETS_UNIFY_STATE_FLAG = 'assetsUnifyState';

/**
 * Result of initializing data sources for the AssetsController.
 */
type DataSourcesInitResult = {
  dataSources: DataSources | Record<string, never>;
  dataSourceMessengers: DataSourceMessengers | null;
  apiClient: ApiPlatformClient | null;
};

/**
 * Singleton init: store a promise to prevent concurrent initializations.
 */
let dataSourcesInitPromise: Promise<DataSourcesInitResult> | null = null;

/**
 * Safely retrieves the bearer token for API authentication.
 *
 * @param initMessenger - The initialization messenger.
 * @returns The bearer token or undefined if retrieval fails.
 */
async function safeGetBearerToken(
  initMessenger: AssetsControllerInitMessenger,
): Promise<string | undefined> {
  try {
    return await initMessenger.call('AuthenticationController:getBearerToken');
  } catch (error) {
    console.warn(`${LOG_PREFIX} Failed to get bearer token`, error);
    return undefined;
  }
}

/**
 * Safely retrieves the token detection preference.
 *
 * @param initMessenger - The initialization messenger.
 * @returns Whether token detection is enabled (defaults to true on error).
 */
async function safeGetTokenDetectionEnabled(
  initMessenger: AssetsControllerInitMessenger,
): Promise<boolean> {
  try {
    const preferencesState = initMessenger.call(
      'PreferencesController:getState',
    );
    return preferencesState?.useTokenDetection ?? true;
  } catch (error) {
    console.warn(
      `${LOG_PREFIX} Failed to read preferences; defaulting tokenDetectionEnabled=true`,
      error,
    );
    return true;
  }
}

/**
 * Initializes data sources once and caches the result.
 * Subsequent calls return the cached promise to prevent duplicate initialization.
 *
 * @param controllerMessenger - The controller messenger for data source communication.
 * @param initMessenger - The initialization messenger for controller actions.
 * @param isEnabled - Function to check if the feature is enabled.
 * @returns The initialized data sources, messengers, and API client.
 */
async function initializeDataSourcesOnce(
  controllerMessenger: AssetsControllerMessenger,
  initMessenger: AssetsControllerInitMessenger,
  isEnabled: () => boolean,
): Promise<DataSourcesInitResult> {
  if (dataSourcesInitPromise) {
    return dataSourcesInitPromise;
  }

  dataSourcesInitPromise = (async (): Promise<DataSourcesInitResult> => {
    // Skip data source initialization if the feature is disabled
    if (!isEnabled()) {
      console.log(
        `${LOG_PREFIX} Feature disabled, skipping data source initialization`,
      );
      return { dataSources: {}, dataSourceMessengers: null, apiClient: null };
    }

    console.log(`${LOG_PREFIX} Initializing data sources...`);

    // Get the root messenger - the messenger pattern uses a parent reference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messengerWithParent = controllerMessenger as unknown as {
      parent?: unknown;
      _parent?: unknown;
    };
    const rootMessenger =
      messengerWithParent.parent ??
      messengerWithParent._parent ??
      controllerMessenger;

    const dataSourceMessengers = initMessengers({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messenger: rootMessenger as any,
      isEnabled,
    });

    if (!dataSourceMessengers) {
      throw new Error(
        `${LOG_PREFIX} Failed to initialize data source messengers`,
      );
    }

    const apiClient = createApiPlatformClient({
      clientProduct: 'metamask-extension',
      getBearerToken: () => safeGetBearerToken(initMessenger),
    });

    const tokenDetectionEnabled =
      await safeGetTokenDetectionEnabled(initMessenger);

    const dataSources = initDataSources({
      messengers: dataSourceMessengers,
      queryApiClient: apiClient,
      rpcDataSourceConfig: { tokenDetectionEnabled },
      isEnabled,
    });

    if (!dataSources) {
      throw new Error(`${LOG_PREFIX} Failed to initialize data sources`);
    }

    console.log(
      `${LOG_PREFIX} Data sources initialized:`,
      Object.keys(dataSources),
    );

    return { dataSources, dataSourceMessengers, apiClient };
  })();

  try {
    return await dataSourcesInitPromise;
  } catch (error) {
    // Reset promise so a later attempt can retry if desired.
    dataSourcesInitPromise = null;
    console.warn(`${LOG_PREFIX} Failed to initialize data sources`, error);
    throw error;
  }
}

/**
 * Init function for the AssetsController.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger - The init messenger to use for the controller.
 * @param request.getController - Function to get a controller by name.
 * @returns The initialized controller.
 */
export const AssetsControllerInit: ControllerInitFunction<
  AssetsController,
  AssetsControllerMessenger,
  AssetsControllerInitMessenger
> = ({ controllerMessenger, persistedState, initMessenger, getController }) => {
  /**
   * Check if the AssetsController feature is enabled based on the remote feature flag.
   *
   * @returns True if the feature is enabled, false otherwise.
   */
  const isEnabled = (): boolean => {
    try {
      const remoteFeatureFlagController = getController(
        'RemoteFeatureFlagController',
      );
      const featureFlag = remoteFeatureFlagController.state.remoteFeatureFlags[
        ASSETS_UNIFY_STATE_FLAG
      ] as AssetsUnifyStateFeatureFlag | undefined;

      return isAssetsUnifyStateFeatureEnabled(
        featureFlag,
        ASSETS_UNIFY_STATE_VERSION_1,
      );
    } catch (error) {
      console.warn(
        `${LOG_PREFIX} Failed to check feature flag, defaulting to disabled`,
        error,
      );
      return false;
    }
  };

  console.log(`${LOG_PREFIX} Initializing...`);

  const controller = new AssetsController({
    messenger: controllerMessenger,
    state: persistedState.AssetsController,
    isEnabled,
  });

  // Register data sources by name with the controller.
  // The data sources register their action handlers with the messenger,
  // and the controller finds them by name when fetching/subscribing.
  // Order determines priority when multiple sources support the same chain.
  controller.registerDataSources([
    'BackendWebsocketDataSource',
    'AccountsApiDataSource',
    'RpcDataSource',
    'SnapDataSource',
    'TokenDataSource',
    'PriceDataSource',
    'DetectionMiddleware',
  ]);

  // Initialize data sources (creates instances and registers action handlers).
  // This is fire-and-forget - the controller will work with cached state
  // until data sources are ready, then start receiving live updates.
  initializeDataSourcesOnce(controllerMessenger, initMessenger, isEnabled)
    .then(() => {
      console.log(`${LOG_PREFIX} Data sources initialized and ready`);
    })
    .catch((error) => {
      // Already logged inside initializeDataSourcesOnce; swallow to keep controller usable
      console.debug(
        `${LOG_PREFIX} Data source initialization deferred:`,
        error,
      );
    });

  return { controller };
};
