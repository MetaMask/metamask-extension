import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { UserOperationControllerMessenger } from '@metamask/user-operation-controller';
import type {
  TransactionControllerEmulateNewTransactionAction,
  TransactionControllerEmulateTransactionUpdateAction,
} from '@metamask/transaction-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * user operation controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 * @returns The restricted messenger.
 */
export function getUserOperationControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<UserOperationControllerMessenger>,
    MessengerEvents<UserOperationControllerMessenger>
  >,
): UserOperationControllerMessenger {
  const controllerMessenger: UserOperationControllerMessenger = new Messenger({
    namespace: 'UserOperationController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'ApprovalController:addRequest',
      'NetworkController:getNetworkClientById',
      'KeyringController:prepareUserOperation',
      'KeyringController:patchUserOperation',
      'KeyringController:signUserOperation',
    ],
  });
  return controllerMessenger;
}

export type UserOperationControllerInitMessenger = ReturnType<
  typeof getUserOperationControllerInitMessenger
>;

type InitMessengerActions =
  | TransactionControllerEmulateNewTransactionAction
  | TransactionControllerEmulateTransactionUpdateAction;

type InitMessengerEvents = never;

/**
 * Create a messenger restricted to the actions/events required to initialize
 * the user operation controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getUserOperationControllerInitMessenger(
  messenger: RootMessenger<InitMessengerActions, InitMessengerEvents>,
) {
  const controllerInitMessenger = new Messenger<
    'UserOperationControllerInit',
    InitMessengerActions,
    InitMessengerEvents,
    typeof messenger
  >({
    namespace: 'UserOperationControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'TransactionController:emulateNewTransaction',
      'TransactionController:emulateTransactionUpdate',
    ],
  });
  return controllerInitMessenger;
}
