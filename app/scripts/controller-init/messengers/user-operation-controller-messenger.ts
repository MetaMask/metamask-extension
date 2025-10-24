import { Messenger } from '@metamask/messenger';
import { AddApprovalRequest } from '@metamask/approval-controller';
import { NetworkControllerGetNetworkClientByIdAction } from '@metamask/network-controller';
import {
  KeyringControllerPatchUserOperationAction,
  KeyringControllerPrepareUserOperationAction,
  KeyringControllerSignUserOperationAction,
} from '@metamask/keyring-controller';
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
