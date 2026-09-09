import {
  MultichainAssetsRatesController,
  MultichainAssetsRatesControllerMessenger,
} from '@metamask/assets-controllers';
import { MessengerClientInitFunction } from '../types';
import { MultichainAssetsRatesControllerInitMessenger } from '../messengers/multichain/multichain-assets-rates-controller-messenger';

/**
 * Initialize the Multichain Assets Rate controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const MultichainAssetsRatesControllerInit: MessengerClientInitFunction<
  MultichainAssetsRatesController,
  MultichainAssetsRatesControllerMessenger,
  MultichainAssetsRatesControllerInitMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new MultichainAssetsRatesController({
    messenger: controllerMessenger,
    state: persistedState.MultichainAssetsRatesController,
    interval: 1000 * 60 * 3, // 3 mins
    isDeprecated: () => true,
  });

  return {
    messengerClient,
  };
};
