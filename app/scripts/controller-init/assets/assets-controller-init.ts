import {
  AssetsController,
  type AssetsControllerFirstInitFetchMetaMetricsPayload,
  type AssetsControllerOptions,
} from '@metamask/assets-controller';
import type { PreferencesState } from '@metamask/preferences-controller';
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
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

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
 * Returns a getter for basic functionality (use external services) from preferences.
 * When true, token/price APIs are used; when false, only RPC is used.
 *
 * @param initMessenger - The initialization messenger.
 * @returns Getter that returns whether basic functionality is enabled (defaults to true on error).
 */
function getIsBasicFunctionality(
  initMessenger: AssetsControllerInitMessenger,
): () => boolean {
  return (): boolean => {
    try {
      const preferencesState = initMessenger.call(
        'PreferencesController:getState',
      ) as { useExternalServices?: boolean } | undefined;
      return preferencesState?.useExternalServices ?? true;
    } catch {
      return true;
    }
  };
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

  // Basic functionality: when true (useExternalServices), token/price APIs are used; when false, RPC only.
  const isBasicFunctionality = getIsBasicFunctionality(initMessenger);

  // Extension: subscribe to PreferencesController:stateChange and notify the controller only when useExternalServices changes.
  // Mobile can pass a different implementation (e.g. Redux or app-specific listener).
  const subscribeToBasicFunctionalityChange = (
    onChange: (isBasic: boolean) => void,
  ): void => {
    controllerMessenger.subscribe(
      'PreferencesController:stateChange',
      (useExternalServices: boolean) => {
        onChange(useExternalServices);
      },
      (state: PreferencesState) =>
        (state as PreferencesState & { useExternalServices?: boolean })
          .useExternalServices ?? true,
    );
  };

  // MetaMetrics: track first init fetch duration and per-data-source latency when AssetsController completes initial load after unlock.
  // Uses initMessenger.call (same pattern as SmartTransactionsController and SubscriptionService).
  // isOptIn: true so the event is sent even when user hasn't opted in (with anonymousId), so it appears in mock Segment during dev.
  const trackMetaMetricsEvent = (
    payload: AssetsControllerFirstInitFetchMetaMetricsPayload,
  ): void => {
    try {
      initMessenger.call(
        'MetaMetricsController:trackEvent',
        {
          event: MetaMetricsEventName.AssetsFirstInitFetchCompleted,
          category: MetaMetricsEventCategory.Background,
          properties: {
            durationMs: payload.durationMs,
            chainIds: payload.chainIds,
            durationByDataSource: payload.durationByDataSource,
          },
        },
        { isOptIn: true },
      );
    } catch {
      // MetaMetricsController may not be available (e.g. init order); skip tracking.
    }
  };

  // Create the controller - it now creates all data sources internally.
  // queryApiClient is cast to the package's type to avoid duplicate @metamask/core-backend type conflicts.
  const options: AssetsControllerOptions = {
    messenger: controllerMessenger,
    state: persistedState.AssetsController,
    isEnabled,
    isBasicFunctionality,
    subscribeToBasicFunctionalityChange,
    queryApiClient: getApiClient(initMessenger),
    rpcDataSourceConfig: {
      tokenDetectionEnabled: () => tokenDetectionEnabled,
      balanceInterval: 30_000,
      detectionInterval: 180_000,
    },
    priceDataSourceConfig: {
      pollInterval: 180_000,
    },
    stakedBalanceDataSourceConfig: {
      pollInterval: 30_000,
      enabled: true,
    },
    trackMetaMetricsEvent,
  };
  const controller = new AssetsController(options);

  return { controller };
};
