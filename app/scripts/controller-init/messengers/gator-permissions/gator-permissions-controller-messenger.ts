import { Messenger } from '@metamask/base-controller';
import {
  type GatorPermissionsControllerMessenger,
  type AllowedActions,
  type AllowedEvents,
} from '@metamask/gator-permissions-controller';
export { type GatorPermissionsControllerMessenger } from '@metamask/gator-permissions-controller';

export function getGatorPermissionsControllerMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
): GatorPermissionsControllerMessenger {
  return messenger.getRestricted({
    name: 'GatorPermissionsController',
    allowedActions: [
      'AuthenticationController:isSignedIn',
      'AuthenticationController:performSignIn',
      'UserStorageController:performGetStorageAllFeatureEntries',
    ],
    allowedEvents: [],
  });
}

export function getGatorPermissionsControllerInitMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'GatorPermissionsControllerInit',
    allowedEvents: [],
    allowedActions: [],
  });
}
