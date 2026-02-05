import { UiStateController } from '@metamask/ui-state-controller';

import type { ControllerInitFunction } from './types';
import type { UiStateControllerMessenger } from './messengers';

/**
 * Initialize the UiStateController.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @returns The initialized controller.
 */
export const UiStateControllerInit: ControllerInitFunction<
  UiStateController,
  UiStateControllerMessenger
> = ({ controllerMessenger }) => {
  const controller = new UiStateController({
    messenger: controllerMessenger,
  });

  return {
    controller,
  };
};
