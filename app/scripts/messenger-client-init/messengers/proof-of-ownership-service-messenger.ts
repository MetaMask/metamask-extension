import { ProofOfOwnershipServiceMessenger } from '@metamask/profile-metrics-controller';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * proof of ownership service.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getProofOfOwnershipServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<ProofOfOwnershipServiceMessenger>,
    MessengerEvents<ProofOfOwnershipServiceMessenger>
  >,
): ProofOfOwnershipServiceMessenger {
  const serviceMessenger: ProofOfOwnershipServiceMessenger = new Messenger({
    namespace: 'ProofOfOwnershipService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: [
      'KeyringController:signPersonalMessage',
      'SnapController:handleRequest',
    ],
  });
  return serviceMessenger;
}
