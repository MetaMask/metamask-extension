import {
  ConfigRegistryController,
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

  const persistedControllerState = persistedState.ConfigRegistryController;

  const controller = new ConfigRegistryController({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messenger: controllerMessenger as any,
    state: persistedControllerState,
    isConfigRegistryApiEnabled,
  });

  const togglePolling = () => {
    try {
      const isEnabled = isConfigRegistryApiEnabled(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        controllerMessenger as any,
      );

      if (isEnabled) {
        try {
          controller.startPolling(null);

          const hasPersistedConfigs =
            controller.state.configs?.networks &&
            Object.keys(controller.state.configs.networks).length > 0;

          if (!hasPersistedConfigs) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (controller as any)._executePoll(null);
            } catch (pollError) {
              // Ignore poll errors during initialization
            }
          }
        } catch (error) {
          // Polling might already be started, which is fine
        }
      } else {
        try {
          controller.stopPolling();
          // New controller uses fallback config when API is disabled; no clearConfigs()
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
      const prevFlag = prevState?.remoteFeatureFlags?.configRegistryApiEnabled;
      const currFlag = currState?.remoteFeatureFlags?.configRegistryApiEnabled;

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
};
