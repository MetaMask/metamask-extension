import type { UserStorageControllerMessenger } from '@metamask/profile-sync-controller/user-storage';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { MetaMetricsControllerTrackEventAction } from '../../../controllers/metametrics-controller';
import { RootMessenger } from '../../../lib/messenger';

type AllowedActions = MessengerActions<UserStorageControllerMessenger>;

type AllowedEvents = MessengerEvents<UserStorageControllerMessenger>;

/**
 * Get a restricted messenger for the User Storage controller. This is scoped to the
 * actions and events that the User Storage controller is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getUserStorageControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const controllerMessenger = new Messenger<
    'UserStorageController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'UserStorageController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      // Keyring Controller Requests
      'KeyringController:getState',
      // Snap Controller Requests
      'SnapController:handleRequest',
      // Auth Controller Requests
      'AuthenticationController:getBearerToken',
      'AuthenticationController:getSessionProfile',
      'AuthenticationController:isSignedIn',
      'AuthenticationController:performSignIn',
      // Address Book Controller Requests
      'AddressBookController:list',
      'AddressBookController:set',
      'AddressBookController:delete',
    ],
    events: [
      // Keyring Controller Events
      'KeyringController:lock',
      'KeyringController:unlock',
      // Address Book Controller Events
      'AddressBookController:contactUpdated',
      'AddressBookController:contactDeleted',
    ],
  });
  return controllerMessenger;
}

export type AllowedInitializationActions =
  MetaMetricsControllerTrackEventAction;

export type UserStorageControllerInitMessenger = ReturnType<
  typeof getUserStorageControllerInitMessenger
>;

/**
 * Get a restricted messenger for initializing the User Storage controller.
 * This is scoped to the actions that are allowed during controller
 * initialization.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getUserStorageControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'UserStorageControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'UserStorageControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['MetaMetricsController:trackEvent'],
  });
  return controllerInitMessenger;
}
