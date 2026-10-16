import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';
import type { NetworkPolicyControllerMessenger } from '../../controllers/network-policy/network-policy-controller.types';

/**
 * Create the policy messenger without delegating authority to other clients.
 *
 * @param messenger - The root messenger.
 * @returns The private policy controller messenger.
 */
export function getNetworkPolicyControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<NetworkPolicyControllerMessenger>,
    MessengerEvents<NetworkPolicyControllerMessenger>
  >,
): NetworkPolicyControllerMessenger {
  return new Messenger({
    namespace: 'NetworkPolicyController',
    parent: messenger,
  });
}
