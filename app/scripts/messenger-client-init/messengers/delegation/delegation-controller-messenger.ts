import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { type DelegationControllerMessenger } from '@metamask/delegation-controller';
import { RootMessenger } from '../../../lib/messenger';

export function getDelegationControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<DelegationControllerMessenger>,
    MessengerEvents<DelegationControllerMessenger>
  >,
): DelegationControllerMessenger {
  const controllerMessenger: DelegationControllerMessenger = new Messenger({
    namespace: 'DelegationController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountsController:getSelectedAccount',
      'KeyringController:signTypedMessage',
    ],
  });
  return controllerMessenger;
}

export type DelegationControllerInitMessenger = ReturnType<
  typeof getDelegationControllerInitMessenger
>;

export function getDelegationControllerInitMessenger(
  messenger: RootMessenger<never, never>,
) {
  const controllerInitMessenger = new Messenger<
    'DelegationControllerInit',
    never,
    never,
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
