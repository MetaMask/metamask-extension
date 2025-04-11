import { AssetsContractController } from '@metamask/assets-controllers';

import type { AssetsContractControllerMessenger } from '../messengers/assets/assets-contract-controller-messenger';
import type { ControllerInitFunction } from '../types';

/**
 * Initialize the AssetsContractController.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.getGlobalChainId - The function to get the global chain id.
 * @returns The initialized controller.
 */
export const AssetsContractControllerInit: ControllerInitFunction<
  AssetsContractController,
  AssetsContractControllerMessenger
> = ({ controllerMessenger, getGlobalChainId }) => {
  const controller = new AssetsContractController({
    messenger: controllerMessenger,
    chainId: getGlobalChainId(),
  });

  return {
    controller,
    memStateKey: null,
  };
};
