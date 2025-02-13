import {
  MultichainAssetsController,
  MultichainAssetsControllerMessenger,
} from '@metamask/assets-controllers';
import { ControllerInitFunction } from '../types';

/**
 * Initialize the Multichain Assets controller.
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const MultichainAssetsControllerInit: ControllerInitFunction<
  MultichainAssetsController,
  MultichainAssetsControllerMessenger,
  never
> = ({ controllerMessenger, persistedState }) => {
  const controller = new MultichainAssetsController({
    messenger: controllerMessenger,
    state: persistedState.MultichainAssetsController,
  });

  return {
    controller,
  };
};
