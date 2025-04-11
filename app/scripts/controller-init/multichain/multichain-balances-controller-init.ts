import { MultichainBalancesController } from '@metamask/assets-controllers';

import type { MultichainBalancesControllerMessenger } from '../messengers/multichain';
import type { ControllerInitFunction } from '../types';

/**
 * Initialize the Multichain Balances controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const MultichainBalancesControllerInit: ControllerInitFunction<
  MultichainBalancesController,
  MultichainBalancesControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new MultichainBalancesController({
    messenger: controllerMessenger,
    state: persistedState.MultichainBalancesController,
  });

  return { controller };
};
