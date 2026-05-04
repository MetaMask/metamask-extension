import { MultichainTransactionsController } from '@metamask/multichain-transactions-controller';
import { MessengerClientInitFunction } from '../types';
import { MultichainTransactionsControllerMessenger } from '../messengers/multichain';

/**
 * Initialize the Multichain Transactions controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const MultichainTransactionsControllerInit: MessengerClientInitFunction<
  MultichainTransactionsController,
  MultichainTransactionsControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new MultichainTransactionsController({
    messenger: controllerMessenger,
    state: persistedState.MultichainTransactionsController,
  });

  return {
    messengerClient,
  };
};
