import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { MultichainRoutingServiceMessenger } from '@metamask/snaps-controllers';
import { KeyringControllerWithKeyringV2Action } from '@metamask/keyring-controller';
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

type InitActions = KeyringControllerWithKeyringV2Action;

export type MultichainRoutingServiceInitMessenger = ReturnType<
  typeof getMultichainRoutingServiceInitMessenger
>;

/**
 * Get a restricted messenger for the multichain router init. Used to look up
 * the per-snap v2 Snap keyring that owns a given account.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getMultichainRoutingServiceInitMessenger(
  messenger: RootMessenger<InitActions, never>,
) {
  const initMessenger = new Messenger<
    'MultichainRoutingServiceInit',
    InitActions,
    never,
    typeof messenger
  >({
    namespace: 'MultichainRoutingServiceInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: initMessenger,
    actions: ['KeyringController:withKeyringV2'],
  });
  return initMessenger;
}
