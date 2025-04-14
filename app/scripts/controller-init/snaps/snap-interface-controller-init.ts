import { SnapInterfaceController } from '@metamask/snaps-controllers';
import { ControllerInitFunction } from '../types';
import { SnapInterfaceControllerMessenger } from '../messengers/snaps';

/**
 * Initialize the Snap interface controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const SnapInterfaceControllerInit: ControllerInitFunction<
  SnapInterfaceController,
  SnapInterfaceControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new SnapInterfaceController({
    // @ts-expect-error: `persistedState.SnapInterfaceController` is not compatible
    // with the expected type.
    // TODO: Look into the type mismatch.
    state: persistedState.SnapInterfaceController,
    // @ts-expect-error: `controllerMessenger` is not compatible with the
    // expected type.
    // TODO: Look into the type mismatch.
    messenger: controllerMessenger,
  });

  return {
    controller,
  };
};
