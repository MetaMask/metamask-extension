import {
  AlertController,
  AlertControllerMessenger,
} from '../controllers/alert-controller';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the alert controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to use for the
 * controller.
 * @returns The initialized controller.
 */
export const AlertControllerInit: MessengerClientInitFunction<
  AlertController,
  AlertControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new AlertController({
    state: persistedState.AlertController,
    messenger: controllerMessenger,
  });

  return {
    messengerClient,
  };
};
