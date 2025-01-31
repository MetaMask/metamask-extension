import { SnapInterfaceController } from '@metamask/snaps-controllers';
import { ControllerInitFunction } from '../types';
import { SnapInterfaceControllerMessenger } from './snap-interface-controller-messenger';

export const SnapInterfaceControllerInit: ControllerInitFunction<
  SnapInterfaceController,
  SnapInterfaceControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new SnapInterfaceController({
    // @ts-expect-error: `persistedState.SnapInterfaceController` is not compatible
    // with the expected type.
    // TODO: Look into the type mismatch.
    state: persistedState.SnapInterfaceController,
    messenger: controllerMessenger,
  });

  return {
    controller,
  };
};
