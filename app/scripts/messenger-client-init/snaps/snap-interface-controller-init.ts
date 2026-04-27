import {
  SnapInterfaceController,
  SnapInterfaceControllerMessenger,
} from '@metamask/snaps-controllers';
import { MessengerClientInitFunction } from '../types';

/**
 * Initialize the Snap interface controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const SnapInterfaceControllerInit: MessengerClientInitFunction<
  SnapInterfaceController,
  SnapInterfaceControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new SnapInterfaceController({
    // @ts-expect-error: `persistedState.SnapInterfaceController` is not compatible
    // with the expected type.
    // TODO: Look into the type mismatch.
    state: persistedState.SnapInterfaceController,
    messenger: controllerMessenger,
  });

  return {
    messengerClient,
  };
};
