import { Messenger } from '@metamask/base-controller';
import {
  MultichainRouterEvents,
  MultichainRouterAllowedActions,
} from '@metamask/snaps-controllers';

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
  messenger: Messenger<MultichainRouterAllowedActions, MultichainRouterEvents>,
) {
  return messenger.getRestricted({
    name: 'MultichainRouter',
    allowedActions: [
      'SnapController:getAll',
      'SnapController:handleRequest',
      'PermissionController:getPermissions',
      'AccountsController:listMultichainAccounts',
    ],
    allowedEvents: [],
  });
}
