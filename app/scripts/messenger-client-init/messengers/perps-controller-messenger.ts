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
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller-method-action-types';
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
  | MetaMetricsControllerTrackEventAction
  | StorageServiceGetItemAction
  | StorageServiceSetItemAction
  | StorageServiceRemoveItemAction;

type AllowedEvents =
  | RemoteFeatureFlagControllerStateChangeEvent
  | AccountTreeControllerSelectedAccountGroupChangeEvent;

export type PerpsControllerMessenger = ReturnType<
  typeof getPerpsControllerMessenger
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
) {
  const perpsControllerMessenger = new Messenger<
    'PerpsController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'PerpsController',
    parent: messenger,
  });

  messenger.delegate({
    messenger: perpsControllerMessenger,
    actions: [
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
      'MetaMetricsController:trackEvent',
      'StorageService:getItem',
      'StorageService:setItem',
      'StorageService:removeItem',
    ],
    events: [
      'RemoteFeatureFlagController:stateChange',
      'AccountTreeController:selectedAccountGroupChange',
    ],
  });

  return perpsControllerMessenger;
}
