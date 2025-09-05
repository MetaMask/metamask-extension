import { Messenger } from '@metamask/base-controller';
import { GatorPermissionsControllerStateChangeEvent } from '@metamask/gator-permissions-controller';
import { HandleSnapRequest, HasSnap } from '@metamask/snaps-controllers';

export type GatorPermissionsControllerMessenger = ReturnType<
  typeof getGatorPermissionsControllerMessenger
>;

type MessengerActions = HandleSnapRequest | HasSnap;
type MessengerEvents = GatorPermissionsControllerStateChangeEvent;

/**
 * Get a restricted messenger for the Gator Permissions controller. This is scoped to the
 * actions and events that the Gator Permissions controller is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getGatorPermissionsControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
) {
  return messenger.getRestricted({
    name: 'GatorPermissionsController',
    allowedActions: ['SnapController:handleRequest', 'SnapController:has'],
    allowedEvents: [],
  });
}
