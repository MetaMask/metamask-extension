import {
  ConfigRegistryController,
  ConfigRegistryApiService,
  isConfigRegistryApiEnabled,
} from '@metamask/config-registry-controller';
import { previousValueComparator } from '../lib/util';
import { ControllerInitFunction } from './types';
import {
  ConfigRegistryControllerMessenger,
  ConfigRegistryControllerInitMessenger,
} from './messengers';

/**
 * Initialize the Config Registry controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
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

  try {
    const fetchFn = globalThis.fetch.bind(globalThis);
    const apiService = new ConfigRegistryApiService({
      apiBaseUrl: 'https://client-config.uat-api.cx.metamask.io/v1/config',
      endpointPath: '/networks',
      fetch: fetchFn,
    });

    const persistedControllerState = persistedState.ConfigRegistryController;

    const controller = new ConfigRegistryController({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messenger: controllerMessenger as any,
      state: persistedControllerState,
      apiService,
    });

    const togglePolling = () => {
      try {
        const isEnabled = isConfigRegistryApiEnabled(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          controllerMessenger as any,
        );

        if (isEnabled) {
          try {
            controller.startPolling({});

            const hasPersistedConfigs =
              controller.state.configs &&
              Object.keys(controller.state.configs).length > 0;

            if (!hasPersistedConfigs) {
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (controller as any)._executePoll({});
              } catch (pollError) {
                // Ignore poll errors
              }
            }
          } catch (error) {
            // Polling might already be started, which is fine
          }
        } else {
          try {
            controller.stopPolling();
          } catch (error) {
            // Polling might not be started, which is fine
          }
        }
      } catch (error) {
        // Ignore errors in togglePolling
      }
    };

    const initialRemoteFeatureFlagsState = initMessenger.call(
      'RemoteFeatureFlagController:getState',
    );
    togglePolling();

    initMessenger.subscribe(
      'RemoteFeatureFlagController:stateChange',
      previousValueComparator((prevState, currState) => {
        const prevFlag =
          prevState?.remoteFeatureFlags?.config_registry_api_enabled;
        const currFlag =
          currState?.remoteFeatureFlags?.config_registry_api_enabled;

        if (prevFlag !== currFlag) {
          togglePolling();
        }

        return true;
      }, initialRemoteFeatureFlagsState),
    );

    return {
      controller,
      memStateKey: 'ConfigRegistryController',
      persistedStateKey: 'ConfigRegistryController',
    };
  } catch (error) {
    console.error('ConfigRegistryController initialization error:', error);
    throw error;
  }
};
