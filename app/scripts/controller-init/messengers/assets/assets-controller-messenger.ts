import { Messenger } from '@metamask/messenger';
import {
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
  AccountTreeControllerSelectedAccountGroupChangeEvent,
} from '@metamask/account-tree-controller';
import {
  KeyringControllerLockEvent,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import {
  NetworkEnablementControllerGetStateAction,
  NetworkEnablementControllerEvents,
} from '@metamask/network-enablement-controller';
import type {
  // Data source action union types
  AccountsApiDataSourceActions,
  BackendWebsocketDataSourceActions,
  SnapDataSourceActions,
  RpcDataSourceActions,
  // Enrichment middleware action union types
  TokenDataSourceActions,
  DetectionMiddlewareActions,
  PriceDataSourceActions,
} from '@metamask/assets-controller';
import { RootMessenger } from '../../../lib/messenger';

/**
 * App lifecycle event: fired when app becomes active (opened/foregrounded)
 */
type AppStateControllerAppOpenedEvent = {
  type: 'AppStateController:appOpened';
  payload: [];
};

/**
 * App lifecycle event: fired when app becomes inactive (closed/backgrounded)
 */
type AppStateControllerAppClosedEvent = {
  type: 'AppStateController:appClosed';
  payload: [];
};

/**
 * The actions that the AssetsController messenger requires.
 *
 * Note: Data sources now CALL AssetsController:activeChainsUpdate and
 * AssetsController:assetsUpdate actions to report updates, rather than
 * the controller subscribing to data source events.
 *
 * Data sources use ApiPlatformClient directly (not via messenger).
 */
type Actions =
  | AccountTreeControllerGetAccountsFromSelectedAccountGroupAction
  | NetworkEnablementControllerGetStateAction
  // Data source actions (including subscribe/unsubscribe for balance subscriptions)
  | AccountsApiDataSourceActions
  | BackendWebsocketDataSourceActions
  | SnapDataSourceActions
  | RpcDataSourceActions
  // Enrichment middleware actions
  | TokenDataSourceActions
  | DetectionMiddlewareActions
  | PriceDataSourceActions;

/**
 * The events that the AssetsController messenger requires.
 *
 * Note: AssetsController does NOT subscribe to data source events.
 * Data sources call AssetsController actions directly to report updates.
 */
type Events =
  | AccountTreeControllerSelectedAccountGroupChangeEvent
  | NetworkEnablementControllerEvents
  | KeyringControllerLockEvent
  | KeyringControllerUnlockEvent
  | AppStateControllerAppOpenedEvent
  | AppStateControllerAppClosedEvent;

export type AssetsControllerMessenger = ReturnType<
  typeof getAssetsControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * AssetsController.
 *
 * @param messenger - The base messenger used to create the restricted messenger.
 * @returns The restricted messenger for AssetsController.
 */
export function getAssetsControllerMessenger(
  messenger: RootMessenger<Actions, Events>,
) {
  const controllerMessenger = new Messenger<
    'AssetsController',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'AssetsController',
    parent: messenger,
  });

  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      'NetworkEnablementController:getState',
      // Data source middleware actions (for fetch pipeline)
      'AccountsApiDataSource:getAssetsMiddleware',
      'AccountsApiDataSource:getActiveChains',
      'AccountsApiDataSource:fetch',
      'AccountsApiDataSource:subscribe',
      'AccountsApiDataSource:unsubscribe',
      'BackendWebsocketDataSource:getActiveChains',
      'BackendWebsocketDataSource:subscribe',
      'BackendWebsocketDataSource:unsubscribe',
      'SnapDataSource:getAssetsMiddleware',
      'SnapDataSource:getActiveChains',
      'SnapDataSource:fetch',
      'SnapDataSource:subscribe',
      'SnapDataSource:unsubscribe',
      'RpcDataSource:getAssetsMiddleware',
      'RpcDataSource:getActiveChains',
      'RpcDataSource:fetch',
      'RpcDataSource:subscribe',
      'RpcDataSource:unsubscribe',
      // Enrichment middleware actions
      'TokenDataSource:getAssetsMiddleware',
      'DetectionMiddleware:getAssetsMiddleware',
      'PriceDataSource:getAssetsMiddleware',
      'PriceDataSource:fetch',
      'PriceDataSource:subscribe',
      'PriceDataSource:unsubscribe',
    ],
    events: [
      'AccountTreeController:selectedAccountGroupChange',
      'NetworkEnablementController:stateChange',
      'KeyringController:lock',
      'KeyringController:unlock',
      // App lifecycle events
      'AppStateController:appOpened',
      'AppStateController:appClosed',
    ],
  });

  return controllerMessenger;
}
