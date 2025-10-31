import { UserOperationController } from '@metamask/user-operation-controller';
import { ControllerInitFunction } from '../types';
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
 * @param request.getController - Function to get other controllers.
 * @returns The initialized controller.
 */
export const UserOperationControllerInit: ControllerInitFunction<
  UserOperationController,
  UserOperationControllerMessenger,
  UserOperationControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState, getController }) => {
  const gasFeeController = getController('GasFeeController');

  const controller = new UserOperationController({
    messenger: controllerMessenger,
    state: persistedState.UserOperationController,
    // @ts-expect-error: `UserOperationController` does not accept `undefined`.
    entrypoint: process.env.EIP_4337_ENTRYPOINT,
    getGasFeeEstimates: (...args) =>
      gasFeeController.fetchGasFeeEstimates(...args),
  });

  controller.hub.on('user-operation-added', (userOperationMeta) =>
    initMessenger.call(
      'TransactionController:emulateNewTransaction',
      userOperationMeta.id,
    ),
  );
  controller.hub.on('transaction-updated', (transactionMeta) =>
    initMessenger.call(
      'TransactionController:emulateTransactionUpdate',
      transactionMeta,
    ),
  );

  return {
    controller,
  };
};
