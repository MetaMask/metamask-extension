import { ApplicationStateController } from '@metamask/application-state-controller';

import type { ControllerInitFunction } from './types';
import type { ApplicationStateControllerMessenger } from './messengers';

/**
 * Initialize the ApplicationStateController.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @returns The initialized controller.
 */
export const ApplicationStateControllerInit: ControllerInitFunction<
  ApplicationStateController,
  ApplicationStateControllerMessenger
> = ({ controllerMessenger }) => {
  // Note: ApplicationStateController doesn't persist state (isClientOpen always starts as false)
  const controller = new ApplicationStateController({
    messenger: controllerMessenger,
  });

  return {
    controller,
  };
};
