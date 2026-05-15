import { Messenger } from '@metamask/messenger';
import { type DelegationControllerMessenger } from '@metamask/delegation-controller';
import { type KeyringControllerSignTypedMessageAction } from '@metamask/keyring-controller';
import { RootMessenger } from '../../../lib/messenger';

export { type DelegationControllerMessenger } from '@metamask/delegation-controller';

export type DelegationControllerInitMessenger = ReturnType<
  typeof getDelegationControllerInitMessenger
>;

type AllowedActions = KeyringControllerSignTypedMessageAction;

type AllowedEvents = never;

export function getDelegationControllerMessenger(
  messenger: RootMessenger<AllowedActions>,
): DelegationControllerMessenger {
  const controllerMessenger = new Messenger<
    'DelegationController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'DelegationController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: ['KeyringController:signTypedMessage'],
  });
  return controllerMessenger;
}

export function getDelegationControllerInitMessenger(
  messenger: RootMessenger<AllowedActions>,
) {
  const controllerInitMessenger = new Messenger<
    'DelegationControllerInit',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'DelegationControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
  });
  return controllerInitMessenger;
}
