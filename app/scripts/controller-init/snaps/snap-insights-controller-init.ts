import { SnapInsightsController } from '@metamask/snaps-controllers';
import { ControllerInitFunction } from '../types';
import { SnapInsightsControllerMessenger } from '../messengers/snaps';

/**
 * Initialize the Snap insights controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const SnapInsightsControllerInit: ControllerInitFunction<
  SnapInsightsController,
  SnapInsightsControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new SnapInsightsController({
    // @ts-expect-error: `persistedState.SnapInsightsController` is not
    // compatible with the expected type.
    // TODO: Look into the type mismatch.
    state: persistedState.SnapInsightsController,
    messenger: controllerMessenger,
  });

  return {
    controller,
  };
};
