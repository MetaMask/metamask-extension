import {
  PreferencesController,
  PreferencesControllerMessenger,
} from '../controllers/preferences-controller';
import { ControllerInitFunction } from './types';

/**
 * Initialize the preferences controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initLangCode
 * @returns The initialized controller.
 */
export const PreferencesControllerInit: ControllerInitFunction<
  PreferencesController,
  PreferencesControllerMessenger
> = ({ controllerMessenger, persistedState, initLangCode }) => {
  const controller = new PreferencesController({
    state: {
      currentLocale: initLangCode ?? '',
      ...persistedState.PreferencesController,
    },
    messenger: controllerMessenger,
  });

  return {
    controller,
  };
};
