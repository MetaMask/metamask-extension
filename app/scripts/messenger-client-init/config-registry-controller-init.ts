import {
  ConfigRegistryController,
  ConfigRegistryControllerMessenger,
} from '@metamask/config-registry-controller';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the Config Registry controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const ConfigRegistryControllerInit: MessengerClientInitFunction<
  ConfigRegistryController,
  ConfigRegistryControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const persistedControllerState = persistedState.ConfigRegistryController;

  const messengerClient = new ConfigRegistryController({
    messenger: controllerMessenger,
    state: persistedControllerState,
  });

  return {
    messengerClient,
  };
};
