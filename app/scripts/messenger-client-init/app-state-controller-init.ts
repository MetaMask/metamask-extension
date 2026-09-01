import {
  AppStateController,
  AppStateControllerMessenger,
} from '../controllers/app-state-controller';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the app state controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.extension - The extension browser API.
 * @returns The initialized controller.
 */
export const AppStateControllerInit: MessengerClientInitFunction<
  AppStateController,
  AppStateControllerMessenger
> = ({ controllerMessenger, persistedState, extension }) => {
  const messengerClient = new AppStateController({
    messenger: controllerMessenger,
    state: persistedState.AppStateController,
    extension,
  });

  return {
    messengerClient,
  };
};
