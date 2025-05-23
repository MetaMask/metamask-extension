import { MultichainNetworkController } from '@metamask/multichain-network-controller';
import { ControllerInitFunction, ControllerInitRequest } from '../types';
import { MultichainNetworkControllerMessenger } from '../messengers/multichain';
import { MultichainNetworkServiceInit } from './multichain-network-service-init';

/**
 * Initialize the Multichain Network controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const MultichainNetworkControllerInit = ({
  controllerMessenger,
  persistedState,
}: ControllerInitRequest<MultichainNetworkControllerMessenger> & {
  fetchFunction: typeof fetch;
}): ReturnType<
  ControllerInitFunction<
    MultichainNetworkController,
    MultichainNetworkControllerMessenger
  >
> => {
  const networkService = MultichainNetworkServiceInit();

  const controller = new MultichainNetworkController({
    messenger: controllerMessenger,
    state: persistedState.MultichainNetworkController,
    networkService,
  });

  return {
    controller,
  };
};
