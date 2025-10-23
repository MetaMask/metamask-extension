import { Messenger } from '@metamask/messenger';
import { GatorPermissionsControllerStateChangeEvent } from '@metamask/gator-permissions-controller';
import { HandleSnapRequest, HasSnap } from '@metamask/snaps-controllers';
import { RootMessenger } from '..';

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
  messenger: RootMessenger<MessengerActions, MessengerEvents>,
) {
  const controllerMessenger = new Messenger<
    'GatorPermissionsController',
    MessengerActions,
    MessengerEvents,
    typeof messenger
  >({
    namespace: 'GatorPermissionsController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: ['SnapController:handleRequest', 'SnapController:has'],
  });
  return controllerMessenger;
}
