import { Messenger } from '@metamask/base-controller';
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

type AllowedActions =
  | AddApprovalRequest
  | KeyringControllerPatchUserOperationAction
  | KeyringControllerPrepareUserOperationAction
  | KeyringControllerSignUserOperationAction
  | NetworkControllerGetNetworkClientByIdAction
  | TransactionControllerEmulateNewTransaction
  | TransactionControllerEmulateTransactionUpdate;

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
  messenger: Messenger<AllowedActions, never>,
) {
  return messenger.getRestricted({
    name: 'UserOperationController',
    allowedActions: [
      'ApprovalController:addRequest',
      'NetworkController:getNetworkClientById',
      'KeyringController:prepareUserOperation',
      'KeyringController:patchUserOperation',
      'KeyringController:signUserOperation',
    ],
    allowedEvents: [],
  });
}

/**
 * Create a messenger restricted to the actions/events required to initialize
 * the user operation controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getUserOperationControllerInitMessenger(
  messenger: Messenger<AllowedActions, never>,
) {
  return messenger.getRestricted({
    name: 'UserOperationControllerInit',
    allowedActions: [
      'TransactionController:emulateNewTransaction',
      'TransactionController:emulateTransactionUpdate',
    ],
    allowedEvents: [],
  });
}
