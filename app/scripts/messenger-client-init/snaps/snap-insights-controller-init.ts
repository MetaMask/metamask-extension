import {
  SnapInsightsController,
  SnapInsightsControllerMessenger,
} from '@metamask/snaps-controllers';
import { MessengerClientInitFunction } from '../types';

/**
 * Initialize the Snap insights controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const SnapInsightsControllerInit: MessengerClientInitFunction<
  SnapInsightsController,
  SnapInsightsControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new SnapInsightsController({
    // @ts-expect-error: `persistedState.SnapInsightsController` is not
    // compatible with the expected type.
    // TODO: Look into the type mismatch.
    state: persistedState.SnapInsightsController,
    messenger: controllerMessenger,
  });

  return {
    messengerClient,
  };
};
