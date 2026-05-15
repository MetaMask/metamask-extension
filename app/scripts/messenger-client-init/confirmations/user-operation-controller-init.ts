import { UserOperationController } from '@metamask/user-operation-controller';
import { MessengerClientInitFunction } from '../types';
import {
  UserOperationControllerMessenger,
  UserOperationControllerInitMessenger,
} from '../messengers';

/**
 * Initialize the user operation controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @param request.persistedState - The persisted state.
 * @param request.getMessengerClient - Function to get other controllers.
 * @returns The initialized controller.
 */
export const UserOperationControllerInit: MessengerClientInitFunction<
  UserOperationController,
  UserOperationControllerMessenger,
  UserOperationControllerInitMessenger
> = ({
  controllerMessenger,
  initMessenger,
  persistedState,
  getMessengerClient,
}) => {
  const gasFeeController = getMessengerClient('GasFeeController');

  const messengerClient = new UserOperationController({
    messenger: controllerMessenger,
    state: persistedState.UserOperationController,
    // @ts-expect-error: `UserOperationController` does not accept `undefined`.
    entrypoint: process.env.EIP_4337_ENTRYPOINT,
    getGasFeeEstimates: (...args) =>
      gasFeeController.fetchGasFeeEstimates(...args),
  });

  messengerClient.hub.on('user-operation-added', (userOperationMeta) =>
    initMessenger.call(
      'TransactionController:emulateNewTransaction',
      userOperationMeta.id,
    ),
  );
  messengerClient.hub.on('transaction-updated', (transactionMeta) =>
    initMessenger.call(
      'TransactionController:emulateTransactionUpdate',
      transactionMeta,
    ),
  );

  return {
    messengerClient,
  };
};
