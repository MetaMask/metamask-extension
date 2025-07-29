import { Messenger } from '@metamask/base-controller';
import {
  type GatorPermissionsControllerMessenger,
  type AllowedActions,
  type AllowedEvents,
} from '@metamask/gator-permissions-controller';

export { type GatorPermissionsControllerMessenger } from '@metamask/gator-permissions-controller';

export type GatorPermissionsControllerInitMessenger = ReturnType<
  typeof getGatorPermissionsControllerInitMessenger
>;

export function getGatorPermissionsControllerMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
): GatorPermissionsControllerMessenger {
  return messenger.getRestricted({
    name: 'GatorPermissionsController',
    allowedActions: ['SnapController:handleRequest'],
    allowedEvents: [],
  });
}

export function getGatorPermissionsControllerInitMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'GatorPermissionsControllerInit',
    allowedEvents: [],
    allowedActions: ['SnapController:handleRequest'],
  });
}
