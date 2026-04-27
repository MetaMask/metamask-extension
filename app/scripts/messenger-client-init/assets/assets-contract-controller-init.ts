import { AssetsContractController } from '@metamask/assets-controllers';
import { MessengerClientInitFunction } from '../types';
import {
  AssetsContractControllerInitMessenger,
  AssetsContractControllerMessenger,
} from '../messengers/assets';
import { getGlobalChainId } from '../init-utils';

/**
 * Initialize the AssetsContractController.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @returns The initialized controller.
 */
export const AssetsContractControllerInit: MessengerClientInitFunction<
  AssetsContractController,
  AssetsContractControllerMessenger,
  AssetsContractControllerInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  // TODO: Fix AssetsContractControllerMessenger type - add AssetsContractControllerActions
  // TODO: Bump @metamask/network-controller to match assets-controllers
  const messengerClient = new AssetsContractController({
    messenger: controllerMessenger,
    chainId: getGlobalChainId(initMessenger),
  });

  return {
    messengerClient,
    memStateKey: null,
    persistedStateKey: null,
  };
};
