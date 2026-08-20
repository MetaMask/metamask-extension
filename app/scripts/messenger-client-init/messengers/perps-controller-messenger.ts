import { Messenger } from '@metamask/messenger';
import {
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
  AccountTreeControllerSelectedAccountGroupChangeEvent,
} from '@metamask/account-tree-controller';
import { GeolocationControllerGetGeolocationAction } from '@metamask/geolocation-controller';
import {
  KeyringControllerGetStateAction,
  KeyringControllerSignTypedMessageAction,
} from '@metamask/keyring-controller';
import {
  NetworkControllerGetStateAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerFindNetworkClientIdByChainIdAction,
} from '@metamask/network-controller';
import type { AuthenticationController } from '@metamask/profile-sync-controller';
import {
  RemoteFeatureFlagControllerGetStateAction,
  RemoteFeatureFlagControllerStateChangeEvent,
} from '@metamask/remote-feature-flag-controller';
import {
  StorageServiceGetItemAction,
  StorageServiceRemoveItemAction,
  StorageServiceSetItemAction,
} from '@metamask/storage-service';
import { TransactionControllerAddTransactionAction } from '@metamask/transaction-controller';
import type {
  AuthenticatedUserStorageServiceGetNotificationPreferencesAction,
  AuthenticatedUserStorageServicePutNotificationPreferencesAction,
} from '@metamask/authenticated-user-storage';
import { RewardsControllerGetPerpsDiscountForAccountAction } from '../../controllers/rewards/rewards-controller-method-action-types';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions =
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | KeyringControllerGetStateAction
  | KeyringControllerSignTypedMessageAction
  | TransactionControllerAddTransactionAction
  | RemoteFeatureFlagControllerGetStateAction
  | AccountTreeControllerGetAccountsFromSelectedAccountGroupAction
  | GeolocationControllerGetGeolocationAction
  | AuthenticationController.AuthenticationControllerGetBearerTokenAction
  | StorageServiceGetItemAction
  | StorageServiceSetItemAction
  | StorageServiceRemoveItemAction
  | RewardsControllerGetPerpsDiscountForAccountAction
  | AuthenticatedUserStorageServiceGetNotificationPreferencesAction
  | AuthenticatedUserStorageServicePutNotificationPreferencesAction;

type AllowedEvents =
  | RemoteFeatureFlagControllerStateChangeEvent
  | AccountTreeControllerSelectedAccountGroupChangeEvent;

export type PerpsControllerMessenger = Messenger<
  'PerpsController',
  AllowedActions,
  AllowedEvents
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * PerpsController.
 *
 * @param messenger - The root messenger used to create the restricted
 * messenger.
 * @returns A restricted messenger for the PerpsController.
 */
export function getPerpsControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
): PerpsControllerMessenger {
  const perpsControllerMessenger: PerpsControllerMessenger = new Messenger({
    namespace: 'PerpsController',
    parent: messenger,
  });

  messenger.delegate({
    messenger: perpsControllerMessenger,
    actions: [
      'AuthenticatedUserStorageService:getNotificationPreferences',
      'AuthenticatedUserStorageService:putNotificationPreferences',
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
      'NetworkController:findNetworkClientIdByChainId',
      'KeyringController:getState',
      'KeyringController:signTypedMessage',
      'TransactionController:addTransaction',
      'RemoteFeatureFlagController:getState',
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      'GeolocationController:getGeolocation',
      'AuthenticationController:getBearerToken',
      'StorageService:getItem',
      'StorageService:setItem',
      'StorageService:removeItem',
      'RewardsController:getPerpsDiscountForAccount',
    ],
    events: [
      'RemoteFeatureFlagController:stateChange',
      'AccountTreeController:selectedAccountGroupChange',
    ],
  });

  return perpsControllerMessenger;
}
