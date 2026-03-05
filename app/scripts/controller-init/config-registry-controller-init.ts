import {
  ConfigRegistryController,
  type FetchConfigResult,
  type RegistryNetworkConfig,
} from '@metamask/config-registry-controller';
import { createProjectLogger } from '@metamask/utils';
import { ControllerInitFunction } from './types';
import {
  ConfigRegistryControllerMessenger,
  ConfigRegistryControllerInitMessenger,
} from './messengers';

const log = createProjectLogger('config-registry-controller-init');

/** Controller messenger type expected by the package (for type-safe cast). */
type PackageConfigRegistryMessenger = ConstructorParameters<
  typeof ConfigRegistryController
>[0]['messenger'];

/** Controller with update (from BaseController) for applying fetched config. */
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
 * Initialize the Config Registry controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const ConfigRegistryControllerInit: ControllerInitFunction<
  ConfigRegistryController,
  ConfigRegistryControllerMessenger,
  ConfigRegistryControllerInitMessenger
> = ({ controllerMessenger, persistedState }) => {
  if (!controllerMessenger) {
    throw new Error('ConfigRegistryController requires a controllerMessenger');
  }

  const persistedControllerState = persistedState.ConfigRegistryController;

  const controller = new ConfigRegistryController({
    messenger: controllerMessenger as PackageConfigRegistryMessenger,
    state: persistedControllerState,
  });

  const hasPersistedConfigs =
    controller.state.configs?.networks &&
    Object.keys(controller.state.configs.networks).length > 0;

  if (!hasPersistedConfigs) {
    setImmediate(() => {
      try {
        const fetchPromise = (
          controllerMessenger as unknown as {
            call: (
              action: string,
              opts?: { etag?: string },
            ) => Promise<FetchConfigResult>;
          }
        ).call('ConfigRegistryApiService:fetchConfig', {});

        fetchPromise
          .then((result: FetchConfigResult) => {
            if (!result.modified || !result.data) {
              return;
            }
            const { data } = result;
            const apiChains = data.data.chains;
            const newConfigs: Record<string, RegistryNetworkConfig> = {};
            apiChains.forEach((chainConfig: RegistryNetworkConfig) => {
              const { chainId } = chainConfig;
              newConfigs[chainId] = chainConfig;
            });
            (controller as ControllerWithUpdate).update((state) => {
              const { configs } = state;
              configs.networks = newConfigs;
              state.version = data.data.version;
              state.lastFetched = Date.now();
              state.etag = result.etag ?? null;
            });
          })
          .catch((err: unknown) => {
            log(
              '[ConfigRegistryControllerInit] Initial fetch failed (non-fatal):',
              err,
            );
          });
      } catch (err) {
        log(
          '[ConfigRegistryControllerInit] Initial fetch failed (non-fatal):',
          err,
        );
      }
    });
  }

  controller.startPolling(null);

  return {
    controller,
    memStateKey: 'ConfigRegistryController',
    persistedStateKey: 'ConfigRegistryController',
  };
};
