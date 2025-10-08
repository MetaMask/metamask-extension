import { Messenger } from '@metamask/base-controller';
import { AddApprovalRequest } from '@metamask/approval-controller';
import { NetworkControllerGetNetworkClientByIdAction } from '@metamask/network-controller';
import {
  KeyringControllerPatchUserOperationAction,
  KeyringControllerPrepareUserOperationAction,
  KeyringControllerSignUserOperationAction,
} from '@metamask/keyring-controller';

type AllowedActions =
  | AddApprovalRequest
  | KeyringControllerPatchUserOperationAction
  | KeyringControllerPrepareUserOperationAction
  | KeyringControllerSignUserOperationAction
  | NetworkControllerGetNetworkClientByIdAction;

export type UserOperationControllerMessenger = ReturnType<
  typeof getUserOperationControllerMessenger
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
