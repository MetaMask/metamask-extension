import { MultichainAssetsController } from '@metamask/assets-controllers';
import { ControllerInitFunction } from '../types';
import { MultichainAssetsControllerMessenger } from '../messengers/multichain';

/**
 * Initialize the Multichain Assets controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const MultichainAssetsControllerInit: ControllerInitFunction<
  MultichainAssetsController,
  MultichainAssetsControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new MultichainAssetsController({
    // @ts-expect-error TODO: Resolve mismatch between base-controller versions.
    messenger: controllerMessenger,
    state: persistedState.MultichainAssetsController,
  });

  return {
    controller,
  };
};
