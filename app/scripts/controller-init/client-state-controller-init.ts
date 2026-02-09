import { ClientStateController } from '@metamask/client-state-controller';

import type { ControllerInitFunction } from './types';
import type { ClientStateControllerMessenger } from './messengers';

/**
 * Initialize the ClientStateController.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @returns The initialized controller.
 */
export const ClientStateControllerInit: ControllerInitFunction<
  ClientStateController,
  ClientStateControllerMessenger
> = ({ controllerMessenger }) => {
  // Note: ClientStateController doesn't persist state (isClientOpen always starts as false)
  const controller = new ClientStateController({
    messenger: controllerMessenger,
  });

  return {
    controller,
  };
};
