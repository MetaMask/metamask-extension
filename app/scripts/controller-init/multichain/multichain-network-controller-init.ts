import { MultichainNetworkController } from '@metamask/multichain-network-controller';

import type { MultichainNetworkControllerMessenger } from '../messengers/multichain';
import type { ControllerInitFunction } from '../types';

/**
 * Initialize the Multichain Network controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const MultichainNetworkControllerInit: ControllerInitFunction<
  MultichainNetworkController,
  MultichainNetworkControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new MultichainNetworkController({
    messenger: controllerMessenger,
    state: persistedState.MultichainNetworkController,
  });

  return {
    controller,
  };
};
