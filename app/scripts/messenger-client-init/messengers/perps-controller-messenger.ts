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
import { RewardsControllerGetPerpsDiscountForAccountAction } from '../../controllers/rewards/rewards-controller-method-action-types';
import { RootMessenger } from '../../lib/messenger';

/**
 * Minimal local mirror of the `@metamask/authenticated-user-storage`
 * notification-preferences blob. The extension does not yet integrate the
 * AuthenticatedUserStorageService; `@metamask/perps-controller@9` only reads
 * `perps.watchlistMarkets` from this blob, and the stub below returns `null`,
 * so the full shape is intentionally left opaque.
 */
type NotificationPreferences = Record<string, unknown>;

/**
 * Action contracts the perps controller (v9+) calls to sync its watchlist with
 * AuthenticatedUserStorageService. The extension has no AUS service yet, so
 * {@link getPerpsControllerMessenger} registers local stubs (see below) that
 * keep the watchlist local-only.
 */
type AuthenticatedUserStorageServiceGetNotificationPreferencesAction = {
  type: 'AuthenticatedUserStorageService:getNotificationPreferences';
  handler: () => Promise<NotificationPreferences | null>;
};

type AuthenticatedUserStorageServicePutNotificationPreferencesAction = {
  type: 'AuthenticatedUserStorageService:putNotificationPreferences';
  handler: (preferences: NotificationPreferences) => Promise<void>;
};

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

  // `@metamask/perps-controller@9` syncs its watchlist with
  // AuthenticatedUserStorageService on init() and on every
  // toggleWatchlistMarket(). The extension does not yet wire that service, so
  // register local stubs: returning `null` preferences makes the controller
  // skip the remote read-merge-write entirely (no error surfaced, no revert of
  // the optimistic update), keeping the watchlist working local-only. Remove
  // these stubs once a real AuthenticatedUserStorageService is integrated.
  const authenticatedUserStorageServiceMessenger = new Messenger<
    'AuthenticatedUserStorageService',
    | AuthenticatedUserStorageServiceGetNotificationPreferencesAction
    | AuthenticatedUserStorageServicePutNotificationPreferencesAction,
    never,
    typeof messenger
  >({
    namespace: 'AuthenticatedUserStorageService',
    parent: messenger,
  });
  authenticatedUserStorageServiceMessenger.registerActionHandler(
    'AuthenticatedUserStorageService:getNotificationPreferences',
    async () => null,
  );
  authenticatedUserStorageServiceMessenger.registerActionHandler(
    'AuthenticatedUserStorageService:putNotificationPreferences',
    async () => undefined,
  );

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
      'MetaMetricsController:trackEvent',
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
