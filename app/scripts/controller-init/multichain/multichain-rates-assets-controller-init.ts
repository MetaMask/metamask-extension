import { MultichainAssetsRatesController } from '@metamask/assets-controllers';
import { ControllerInitFunction } from '../types';
import { MultiChainAssetsRatesControllerMessenger } from '../messengers/multichain';

/**
 * Initialize the Multichain Assets Rate controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const MultiChainAssetsRatesControllerInit: ControllerInitFunction<
  MultichainAssetsRatesController,
  MultiChainAssetsRatesControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new MultichainAssetsRatesController({
    messenger: controllerMessenger,
    state: persistedState.MultichainAssetsRatesController,
  });

  return {
    controller,
  };
};
