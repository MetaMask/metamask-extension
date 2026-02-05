import { ClientController } from '@metamask/client-controller';

import type { ControllerInitFunction } from './types';
import type { ClientControllerMessenger } from './messengers';

/**
 * Initialize the ClientController.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @returns The initialized controller.
 */
export const ClientControllerInit: ControllerInitFunction<
  ClientController,
  ClientControllerMessenger
> = ({ controllerMessenger }) => {
  const controller = new ClientController({
    messenger: controllerMessenger,
  });

  return {
    controller,
  };
};
