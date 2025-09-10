import type { UserStorageControllerStateChangeEvent } from '@metamask/profile-sync-controller/user-storage';
import { Messenger } from '@metamask/base-controller';
import {
  KeyringControllerGetStateAction,
  KeyringControllerLockEvent,
  KeyringControllerUnlockEvent,
  KeyringControllerWithKeyringAction,
} from '@metamask/keyring-controller';
import { HandleSnapRequest } from '@metamask/snaps-controllers';
import {
  AuthenticationControllerGetBearerToken,
  AuthenticationControllerGetSessionProfile,
  AuthenticationControllerIsSignedIn,
  AuthenticationControllerPerformSignIn,
} from '@metamask/profile-sync-controller/auth';
import {
  AccountsControllerAccountAddedEvent,
  AccountsControllerAccountRenamedEvent,
  AccountsControllerListAccountsAction,
  AccountsControllerUpdateAccountMetadataAction,
  AccountsControllerUpdateAccountsAction,
} from '@metamask/accounts-controller';
import {
  AddressBookControllerContactUpdatedEvent,
  AddressBookControllerContactDeletedEvent,
  AddressBookControllerListAction,
  AddressBookControllerSetAction,
  AddressBookControllerDeleteAction,
} from '@metamask/address-book-controller';
import {
  NetworkControllerAddNetworkAction,
  NetworkControllerGetStateAction,
  NetworkControllerNetworkRemovedEvent,
  NetworkControllerRemoveNetworkAction,
  NetworkControllerUpdateNetworkAction,
} from '@metamask/network-controller';
import { MetaMetricsControllerTrackEventAction } from '../../../controllers/metametrics-controller';

type MessengerActions =
  // Keyring Requests
  | KeyringControllerGetStateAction
  // Snap Requests
  | HandleSnapRequest
  // Auth Requests
  | AuthenticationControllerGetBearerToken
  | AuthenticationControllerGetSessionProfile
  | AuthenticationControllerPerformSignIn
  | AuthenticationControllerIsSignedIn
  // Account Syncing
  | AccountsControllerListAccountsAction
  | AccountsControllerUpdateAccountMetadataAction
  | AccountsControllerUpdateAccountsAction
  | KeyringControllerWithKeyringAction
  // Network Syncing
  | NetworkControllerGetStateAction
  | NetworkControllerAddNetworkAction
  | NetworkControllerRemoveNetworkAction
  | NetworkControllerUpdateNetworkAction
  // Contact Syncing
  | AddressBookControllerListAction
  | AddressBookControllerSetAction
  | AddressBookControllerDeleteAction;

type MessengerEvents =
  | UserStorageControllerStateChangeEvent
  | KeyringControllerLockEvent
  | KeyringControllerUnlockEvent
  // Account Syncing Events
  | AccountsControllerAccountAddedEvent
  | AccountsControllerAccountRenamedEvent
  // Contact Syncing Events
  | AddressBookControllerContactUpdatedEvent
  | AddressBookControllerContactDeletedEvent
  // Network Syncing Events
  | NetworkControllerNetworkRemovedEvent;

export type UserStorageControllerMessenger = ReturnType<
  typeof getUserStorageControllerMessenger
>;

/**
 * Get a restricted messenger for the User Storage controller. This is scoped to the
 * actions and events that the User Storage controller is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getUserStorageControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
) {
  return messenger.getRestricted({
    name: 'UserStorageController',
    allowedActions: [
      // Keyring Controller Requests
      'KeyringController:getState',
      'KeyringController:withKeyring',
      // Snap Controller Requests
      'SnapController:handleRequest',
      // Auth Controller Requests
      'AuthenticationController:getBearerToken',
      'AuthenticationController:getSessionProfile',
      'AuthenticationController:isSignedIn',
      'AuthenticationController:performSignIn',
      // Accounts Controller Requests
      'AccountsController:listAccounts',
      'AccountsController:updateAccountMetadata',
      'AccountsController:updateAccounts',
      // Address Book Controller Requests
      'AddressBookController:list',
      'AddressBookController:set',
      'AddressBookController:delete',
    ],
    allowedEvents: [
      // Keyring Controller Events
      'KeyringController:lock',
      'KeyringController:unlock',
      // Accounts Controller Events
      'AccountsController:accountAdded',
      'AccountsController:accountRenamed',
      // Address Book Controller Events
      'AddressBookController:contactUpdated',
      'AddressBookController:contactDeleted',
      // Network Controller Events
      'NetworkController:networkRemoved',
    ],
  });
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
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'UserStorageControllerInit',
    allowedActions: ['MetaMetricsController:trackEvent'],
    allowedEvents: [],
  });
}
