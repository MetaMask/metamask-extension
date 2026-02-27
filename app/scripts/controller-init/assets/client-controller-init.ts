import { ClientController } from '@metamask/client-controller';
import { type ControllerInitFunction } from '../types';
import type { ClientControllerMessenger } from '../messengers/assets';

/**
 * Initialize the ClientController.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const ClientControllerInit: ControllerInitFunction<
  ClientController,
  ClientControllerMessenger,
  void
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new ClientController({
    messenger: controllerMessenger,
    state: persistedState.ClientController,
  });

  return {
    controller,
  };
};
