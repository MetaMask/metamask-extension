import { Messenger } from '@metamask/base-controller';
import { GatorPermissionsControllerStateChangeEvent } from '@metamask/gator-permissions-controller';
import { HandleSnapRequest, HasSnap } from '@metamask/snaps-controllers';

export type GatorPermissionsControllerInitMessenger = ReturnType<
  typeof getGatorPermissionsControllerInitMessenger
>;

type MessengerActions = HandleSnapRequest | HasSnap;
type MessengerEvents = GatorPermissionsControllerStateChangeEvent;

export function getGatorPermissionsControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
) {
  return messenger.getRestricted({
    name: 'GatorPermissionsController',
    allowedActions: ['SnapController:handleRequest', 'SnapController:has'],
    allowedEvents: [],
  });
}

export function getGatorPermissionsControllerInitMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
) {
  return messenger.getRestricted({
    name: 'GatorPermissionsControllerInit',
    allowedEvents: [],
    allowedActions: ['SnapController:handleRequest', 'SnapController:has'],
  });
}
