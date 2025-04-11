import { MultichainTransactionsController } from '@metamask/multichain-transactions-controller';

import type { MultichainTransactionsControllerMessenger } from '../messengers/multichain';
import type { ControllerInitFunction } from '../types';

/**
 * Initialize the Multichain Transactions controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const MultichainTransactionsControllerInit: ControllerInitFunction<
  MultichainTransactionsController,
  MultichainTransactionsControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new MultichainTransactionsController({
    messenger: controllerMessenger,
    state: persistedState.MultichainTransactionsController,
  });

  return {
    controller,
  };
};
