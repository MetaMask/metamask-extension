import { AssetsController } from '@metamask/assets-controller';
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

const ASSETS_UNIFY_STATE_FLAG = 'assetsUnifyState';

/**
 * Cached API client instance.
 */
let apiClient: ApiPlatformClient | null = null;

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
  } catch {
    return undefined;
  }
}

/**
 * Safely retrieves the token detection preference.
 *
 * @param initMessenger - The initialization messenger.
 * @returns Whether token detection is enabled (defaults to true on error).
 */
function safeGetTokenDetectionEnabled(
  initMessenger: AssetsControllerInitMessenger,
): boolean {
  try {
    const preferencesState = initMessenger.call(
      'PreferencesController:getState',
    );
    return preferencesState?.useTokenDetection ?? true;
  } catch {
    return true;
  }
}

/**
 * Gets or creates the API platform client.
 *
 * @param initMessenger - The initialization messenger.
 * @returns The API platform client.
 */
function getApiClient(
  initMessenger: AssetsControllerInitMessenger,
): ApiPlatformClient {
  if (!apiClient) {
    apiClient = createApiPlatformClient({
      clientProduct: 'metamask-extension',
      getBearerToken: () => safeGetBearerToken(initMessenger),
    });
  }
  return apiClient;
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
    } catch {
      return false;
    }
  };

  // Get token detection preference
  const tokenDetectionEnabled = safeGetTokenDetectionEnabled(initMessenger);

  // Create the controller - it now creates all data sources internally
  const controller = new AssetsController({
    messenger: controllerMessenger,
    state: persistedState.AssetsController,
    isEnabled,
    queryApiClient: getApiClient(initMessenger),
    rpcDataSourceConfig: { tokenDetectionEnabled },
  });

  return { controller };
};
