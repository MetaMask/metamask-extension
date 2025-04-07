import { Messenger } from '@metamask/base-controller';
import {
  DelegationControllerMessenger,
  type AllowedActions,
} from '@metamask/delegation-controller';

export { type DelegationControllerMessenger } from '@metamask/delegation-controller';

export type DelegationControllerInitMessenger = ReturnType<
  typeof getDelegationControllerMessenger
>;

type AllowedEvents = never;

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
