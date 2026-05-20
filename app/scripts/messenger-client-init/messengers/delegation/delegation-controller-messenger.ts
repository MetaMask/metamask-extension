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
    actions: ['KeyringController:signTypedMessage'],
  });
  return controllerMessenger;
}
