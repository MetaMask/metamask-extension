import { EnsController } from '@metamask/ens-controller';
import {
  EnsControllerInitMessenger,
  EnsControllerMessenger,
} from '../messengers';
import { ControllerInitFunction } from '../types';

/**
 * Initialize the ENS controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @returns The initialized controller.
 */
export const EnsControllerInit: ControllerInitFunction<
  EnsController,
  EnsControllerMessenger,
  EnsControllerInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  const controller = new EnsController({
    messenger: controllerMessenger,
    onNetworkDidChange: (listener) =>
      initMessenger.subscribe('NetworkController:networkDidChange', listener),
  });

  return {
    persistedStateKey: null,
    controller,
  };
};
