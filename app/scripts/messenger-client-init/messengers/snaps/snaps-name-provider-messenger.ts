import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../../lib/messenger';
import { SnapsNameProviderMessenger } from '../../../lib/SnapsNameProvider';

/**
 * Create a messenger restricted to the allowed actions and events of the Snaps
 * name provider.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getSnapsNameProviderMessenger(
  messenger: RootMessenger<
    MessengerActions<SnapsNameProviderMessenger>,
    MessengerEvents<SnapsNameProviderMessenger>
  >,
) {
  const providerMessenger: SnapsNameProviderMessenger = new Messenger({
    namespace: 'SnapsNameProvider',
    parent: messenger,
  });
  messenger.delegate({
    messenger: providerMessenger,
    actions: [
      'SnapController:getAllSnaps',
      'SnapController:getSnap',
      'SnapController:handleRequest',
      'PermissionController:getState',
    ],
  });
  return providerMessenger;
}
