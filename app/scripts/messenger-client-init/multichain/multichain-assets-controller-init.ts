import {
  MultichainAssetsController,
  MultichainAssetsControllerMessenger,
} from '@metamask/assets-controllers';
import { MessengerClientInitFunction } from '../types';
import { MultichainAssetsControllerInitMessenger } from '../messengers/multichain/multichain-assets-controller-messenger';

/**
 * Initialize the Multichain Assets controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const MultichainAssetsControllerInit: MessengerClientInitFunction<
  MultichainAssetsController,
  MultichainAssetsControllerMessenger,
  MultichainAssetsControllerInitMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new MultichainAssetsController({
    messenger: controllerMessenger,
    state: persistedState.MultichainAssetsController,
    isDeprecated: () => true,
  });

  return {
    messengerClient,
  };
};
