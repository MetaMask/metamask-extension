import {
  AppStateController,
  AppStateControllerMessenger,
} from '../controllers/app-state-controller';
import { ControllerInitFunction } from './types';

/**
 * Initialize the app state controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.setLocked - Function to set the app as locked.
 * @param request.extension - The extension browser API.
 * @returns The initialized controller.
 */
export const AppStateControllerInit: ControllerInitFunction<
  AppStateController,
  AppStateControllerMessenger
> = ({ controllerMessenger, persistedState, setLocked, extension }) => {
  const controller = new AppStateController({
    messenger: controllerMessenger,
    state: persistedState.AppStateController,
    onInactiveTimeout: () => setLocked(),
    extension,
  });

  return {
    controller,
  };
};
