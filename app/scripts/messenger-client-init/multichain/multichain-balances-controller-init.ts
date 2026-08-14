import {
  MultichainBalancesController,
  MultichainBalancesControllerMessenger,
} from '@metamask/assets-controllers';
import { MessengerClientInitFunction } from '../types';

/**
 * Initialize the Multichain Balances controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const MultichainBalancesControllerInit: MessengerClientInitFunction<
  MultichainBalancesController,
  MultichainBalancesControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new MultichainBalancesController({
    messenger: controllerMessenger,
    state: persistedState.MultichainBalancesController,
  });

  return { messengerClient };
};
