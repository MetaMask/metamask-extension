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
} from '@metamask/accounts-controller';
import {
  NetworkControllerAddNetworkAction,
  NetworkControllerGetStateAction,
  NetworkControllerNetworkRemovedEvent,
  NetworkControllerRemoveNetworkAction,
  NetworkControllerUpdateNetworkAction,
} from '@metamask/network-controller';

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
  | KeyringControllerWithKeyringAction
  // Network Syncing
  | NetworkControllerGetStateAction
  | NetworkControllerAddNetworkAction
  | NetworkControllerRemoveNetworkAction
  | NetworkControllerUpdateNetworkAction;

type MessengerEvents =
  | UserStorageControllerStateChangeEvent
  | KeyringControllerLockEvent
  | KeyringControllerUnlockEvent
  // Account Syncing Events
  | AccountsControllerAccountAddedEvent
  | AccountsControllerAccountRenamedEvent
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
      // Network Controller Requests
      'NetworkController:getState',
      'NetworkController:addNetwork',
      'NetworkController:removeNetwork',
      'NetworkController:updateNetwork',
    ],
    allowedEvents: [
      // Keyring Controller Events
      'KeyringController:lock',
      'KeyringController:unlock',
      // Accounts Controller Events
      'AccountsController:accountAdded',
      'AccountsController:accountRenamed',
      // Network Controller Events
      'NetworkController:networkRemoved',
    ],
  });
}
