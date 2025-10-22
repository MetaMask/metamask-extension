import { AlertController } from '../controllers/alert-controller';
import { ControllerInitFunction } from './types';
import { AlertControllerMessenger } from './messengers';

/**
 * Initialize the alert controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to use for the
 * controller.
 * @returns The initialized controller.
 */
export const AlertControllerInit: ControllerInitFunction<
  AlertController,
  AlertControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new AlertController({
    state: persistedState.AlertController,
    messenger: controllerMessenger,
  });

  return {
    controller,
  };
};
