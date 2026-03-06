import {
  ConfigRegistryController,
  type FetchConfigResult,
  type RegistryNetworkConfig,
} from '@metamask/config-registry-controller';
import { createProjectLogger } from '@metamask/utils';
import { ControllerInitFunction } from './types';
import type {
  ConfigRegistryControllerMessenger,
  ConfigRegistryControllerInitMessenger,
} from './messengers/config-registry-controller-messenger';

const log = createProjectLogger('config-registry-controller-init');

/**
 * Controller messenger shape used for the initial fetch. The extension's restricted
 * messenger doesn't expose this action type directly; we cast to this for the fetch call only.
 */
type ControllerMessengerWithFetch = {
  call(
    action: 'ConfigRegistryApiService:fetchConfig',
    opts?: { etag?: string },
  ): Promise<FetchConfigResult>;
};

/**
 * Controller with update (from BaseController) for applying fetched config.
 * The package does not export a type that includes update(); this local type is required
 * until the package exposes it.
 */
type ControllerWithUpdate = ConfigRegistryController & {
  update(
    producer: (state: {
      configs: { networks: Record<string, RegistryNetworkConfig> };
      version: string | null;
      lastFetched: number | null;
      etag: string | null;
    }) => void,
  ): void;
};

/**
 * Returns whether the Config Registry API feature flag is enabled from the init messenger.
 * Used to guard the initial fetch and polling start.
 * @param initMessenger
 */
function isConfigRegistryApiEnabled(
  initMessenger: ConfigRegistryControllerInitMessenger | undefined,
): boolean {
  if (!initMessenger) {
    return false;
  }
  const state = initMessenger.call('RemoteFeatureFlagController:getState');
  return Boolean(
    state &&
      typeof state === 'object' &&
      'remoteFeatureFlags' in state &&
      (state as { remoteFeatureFlags?: { configRegistryApiEnabled?: boolean } })
        .remoteFeatureFlags?.configRegistryApiEnabled,
  );
}

/**
 * Runs the initial config registry fetch and applies the result to the controller.
 * Used both at init (when flag is already true) and when the flag turns true later.
 *
 * @param controller - ConfigRegistryController instance to update with fetched config.
 * @param controllerMessenger - Messenger that can call ConfigRegistryApiService:fetchConfig.
 */
function runInitialFetch(
  controller: ControllerWithUpdate,
  controllerMessenger: ControllerMessengerWithFetch,
): void {
  setImmediate(async () => {
    try {
      const fetchResult = await controllerMessenger.call(
        'ConfigRegistryApiService:fetchConfig',
        {},
      );

      if (!fetchResult.modified || !fetchResult.data) {
        return;
      }
      const { data } = fetchResult;
      const apiChains = data.data.chains;
      const newConfigs: Record<string, RegistryNetworkConfig> = {};
      apiChains.forEach((chainConfig: RegistryNetworkConfig) => {
        const { chainId } = chainConfig;
        newConfigs[chainId] = chainConfig;
      });
      controller.update((state) => {
        const { configs } = state;
        configs.networks = newConfigs;
        state.version = data.data.version;
        state.lastFetched = Date.now();
        state.etag = fetchResult.etag ?? null;
      });
    } catch (err) {
      log(
        '[ConfigRegistryControllerInit] Initial fetch failed (non-fatal):',
        err,
      );
    }
  });
}

/**
 * Initialize the Config Registry controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The init messenger to read feature flag state.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const ConfigRegistryControllerInit: ControllerInitFunction<
  ConfigRegistryController,
  ConfigRegistryControllerMessenger,
  ConfigRegistryControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  if (!controllerMessenger) {
    throw new Error('ConfigRegistryController requires a controllerMessenger');
  }

  const persistedControllerState = persistedState.ConfigRegistryController;

  const controller = new ConfigRegistryController({
    messenger: controllerMessenger,
    state: persistedControllerState,
  });

  const hasPersistedConfigs =
    controller.state.configs?.networks &&
    Object.keys(controller.state.configs.networks).length > 0;

  const isConfigRegistryApiEnabledFlag =
    isConfigRegistryApiEnabled(initMessenger);

  // Only fetch when we have no persisted config and the feature is enabled.
  // When the flag is off, we skip the fetch to avoid unnecessary network requests.
  if (!hasPersistedConfigs && isConfigRegistryApiEnabledFlag) {
    runInitialFetch(
      controller as ControllerWithUpdate,
      controllerMessenger as unknown as ControllerMessengerWithFetch,
    );
  }

  let pollingStarted = isConfigRegistryApiEnabledFlag;
  if (isConfigRegistryApiEnabledFlag) {
    controller.startPolling(null);
  }

  // When the flag becomes true later (e.g. after remote flags load on first UI open),
  // run the initial fetch and start polling so the dynamic list appears without a refresh.
  if (initMessenger) {
    initMessenger.subscribe('RemoteFeatureFlagController:stateChange', () => {
      if (!isConfigRegistryApiEnabled(initMessenger)) {
        return;
      }
      const hasConfigs =
        controller.state.configs?.networks &&
        Object.keys(controller.state.configs.networks).length > 0;
      if (hasConfigs) {
        return;
      }
      runInitialFetch(
        controller as ControllerWithUpdate,
        controllerMessenger as unknown as ControllerMessengerWithFetch,
      );
      if (!pollingStarted) {
        pollingStarted = true;
        controller.startPolling(null);
      }
    });
  }

  return {
    controller,
    memStateKey: 'ConfigRegistryController',
    persistedStateKey: 'ConfigRegistryController',
  };
};
