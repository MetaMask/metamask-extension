import { AssetsContractController } from '@metamask/assets-controllers';
import { ControllerInitFunction } from '../types';
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
export const AssetsContractControllerInit: ControllerInitFunction<
  AssetsContractController,
  AssetsContractControllerMessenger,
  AssetsContractControllerInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  const controller = new AssetsContractController({
    messenger: controllerMessenger,
    chainId: getGlobalChainId(initMessenger),
  });

  return {
    controller,
    memStateKey: null,
  };
};
