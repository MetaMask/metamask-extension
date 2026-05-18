import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { MultichainRoutingServiceMessenger } from '@metamask/snaps-controllers';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the multichain router. This is scoped to the
 * actions and events that the multichain router is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getMultichainRoutingServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<MultichainRoutingServiceMessenger>,
    MessengerEvents<MultichainRoutingServiceMessenger>
  >,
) {
  const routerMessenger: MultichainRoutingServiceMessenger = new Messenger({
    namespace: 'MultichainRoutingService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: routerMessenger,
    actions: [
      'SnapController:getRunnableSnaps',
      'SnapController:handleRequest',
      'PermissionController:getPermissions',
      'AccountsController:listMultichainAccounts',
    ],
  });
  return routerMessenger;
}
