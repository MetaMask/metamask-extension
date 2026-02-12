import { Messenger } from '@metamask/messenger';
import {
  MultichainRouterEvents,
  MultichainRouterAllowedActions,
} from '@metamask/snaps-controllers';
import { RootMessenger } from '../../../lib/messenger';

export type MultichainRouterMessenger = ReturnType<
  typeof getMultichainRouterMessenger
>;

/**
 * Get a restricted messenger for the multichain router. This is scoped to the
 * actions and events that the multichain router is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getMultichainRouterMessenger(
  messenger: RootMessenger<
    MultichainRouterAllowedActions,
    MultichainRouterEvents
  >,
) {
  const routerMessenger = new Messenger<
    'MultichainRouter',
    MultichainRouterAllowedActions,
    MultichainRouterEvents,
    typeof messenger
  >({
    namespace: 'MultichainRouter',
    parent: messenger,
  });
  messenger.delegate({
    messenger: routerMessenger,
    actions: [
      'SnapController:getAll',
      'SnapController:handleRequest',
      'PermissionController:getPermissions',
      'AccountsController:listMultichainAccounts',
    ],
  });
  return routerMessenger;
}
