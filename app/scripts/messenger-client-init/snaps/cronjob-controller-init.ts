import {
  CronjobController,
  CronjobControllerMessenger,
} from '@metamask/snaps-controllers';
import { MessengerClientInitFunction } from '../types';

/**
 * Initialize the cronjob controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.getCronjobControllerStorageManager - Get the storage manager for the
 * CronjobController.
 * @returns The initialized controller.
 */
export const CronjobControllerInit: MessengerClientInitFunction<
  CronjobController,
  CronjobControllerMessenger
> = ({
  controllerMessenger,
  persistedState,
  getCronjobControllerStorageManager,
}) => {
  const messengerClient = new CronjobController({
    // @ts-expect-error: `persistedState.CronjobController` is not compatible
    // with the expected type.
    // TODO: Look into the type mismatch.
    state: persistedState.CronjobController,
    messenger: controllerMessenger,
    // @ts-expect-error TODO: fix incompatible types
    stateManager: getCronjobControllerStorageManager(),
  });

  return {
    messengerClient,
    persistedStateKey: null,
  };
};
