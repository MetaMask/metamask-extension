import { AssetsController } from '@metamask/assets-controller';
import { ControllerInitFunction } from '../types';
import {
  AssetsControllerMessenger,
  AssetsControllerInitMessenger,
} from '../messengers/assets/assets-controller-messenger';

/**
 * Initialize the AssetsController.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const AssetsControllerInit: ControllerInitFunction<
  AssetsController,
  AssetsControllerMessenger,
  AssetsControllerInitMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new AssetsController({
    messenger: controllerMessenger,
    state: persistedState.AssetsController,
  });

  return {
    controller,
  };
};
