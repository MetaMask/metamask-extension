import { MultiChainAssetsRatesController } from '@metamask/assets-controllers';
import { ControllerInitFunction } from '../types';
import { MultichainAssetsRatesControllerMessenger } from '../messengers/multichain';

/**
 * Initialize the Multichain Assets Rate controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const MultiChainAssetsRatesControllerInit: ControllerInitFunction<
  MultiChainAssetsRatesController,
  MultichainAssetsRatesControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new MultiChainAssetsRatesController({
    messenger: controllerMessenger,
    state: persistedState.MultiChainAssetsRatesController,
  });

  return {
    controller,
  };
};
