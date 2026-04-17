import {
  PreferencesController,
  PreferencesControllerMessenger,
} from '../controllers/preferences-controller';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the preferences controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initLangCode
 * @returns The initialized controller.
 */
export const PreferencesControllerInit: MessengerClientInitFunction<
  PreferencesController,
  PreferencesControllerMessenger
> = ({ controllerMessenger, persistedState, initLangCode }) => {
  const messengerClient = new PreferencesController({
    state: {
      currentLocale: initLangCode ?? '',
      ...persistedState.PreferencesController,
    },
    messenger: controllerMessenger,
  });

  return {
    messengerClient,
  };
};
