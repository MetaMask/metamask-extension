import { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import { Messenger } from '@metamask/base-controller';
import { type DelegationControllerMessenger } from '@metamask/delegation-controller';
import { type KeyringControllerSignTypedMessageAction } from '@metamask/keyring-controller';

export { type DelegationControllerMessenger } from '@metamask/delegation-controller';

export type DelegationControllerInitMessenger = ReturnType<
  typeof getDelegationControllerMessenger
>;

type AllowedActions =
  | KeyringControllerSignTypedMessageAction
  | AccountsControllerGetSelectedAccountAction;

type AllowedEvents = never;

/**
 * Get a restricted messenger for the Delegation controller. This is scoped to the
 * actions and events that the Delegation controller is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getDelegationControllerMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
): DelegationControllerMessenger {
  return messenger.getRestricted({
    name: 'DelegationController',
    allowedActions: [
      'AccountsController:getSelectedAccount',
      'KeyringController:signTypedMessage',
    ],
    allowedEvents: [],
  });
}
