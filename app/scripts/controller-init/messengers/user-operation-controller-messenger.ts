import { Messenger } from '@metamask/messenger';
import { AddApprovalRequest } from '@metamask/approval-controller';
import { NetworkControllerGetNetworkClientByIdAction } from '@metamask/network-controller';
import {
  KeyringControllerPatchUserOperationAction,
  KeyringControllerPrepareUserOperationAction,
  KeyringControllerSignUserOperationAction,
} from '@metamask/keyring-controller';
import type {
  TransactionControllerEmulateNewTransaction,
  TransactionControllerEmulateTransactionUpdate,
} from '@metamask/transaction-controller';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions =
  | AddApprovalRequest
  | KeyringControllerPatchUserOperationAction
  | KeyringControllerPrepareUserOperationAction
  | KeyringControllerSignUserOperationAction
  | NetworkControllerGetNetworkClientByIdAction;

export type UserOperationControllerMessenger = ReturnType<
  typeof getUserOperationControllerMessenger
>;

export type UserOperationControllerInitMessenger = ReturnType<
  typeof getUserOperationControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * user operation controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getUserOperationControllerMessenger(
  messenger: RootMessenger<AllowedActions, never>,
) {
  const controllerMessenger = new Messenger<
    'UserOperationController',
    AllowedActions,
    never,
    typeof messenger
  >({
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

type InitMessengerActions =
  | TransactionControllerEmulateNewTransaction
  | TransactionControllerEmulateTransactionUpdate;

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
