import type {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
} from '@metamask/base-controller';
import { Messenger } from '@metamask/messenger';
import type {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetNetworkConfigurationByNetworkClientId,
  NetworkControllerGetStateAction,
  NetworkControllerNetworkDidChangeEvent,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import { AuthenticationController } from '@metamask/profile-sync-controller';
import {
  AccountsControllerGetAccountAction,
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerSelectedEvmAccountChangeEvent,
} from '@metamask/accounts-controller';
import {
  KeyringControllerGetStateAction,
  KeyringControllerLockEvent,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import {
  TokenListController,
  TokensControllerAddDetectedTokensAction,
  TokensControllerAddTokensAction,
  TokensControllerGetStateAction,
  AssetsContractControllerGetBalancesInSingleCallAction,
  AssetsContractControllerGetBalancesUsingMulticallAction,
} from '@metamask/assets-controllers';
import { TransactionControllerTransactionConfirmedEvent } from '@metamask/transaction-controller';
import {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../controllers/preferences-controller';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller';
import { RootMessenger } from '../../lib/messenger';

// Not exported from `@metamask/assets-controllers`.
type TokenListControllerGetStateAction = ControllerGetStateAction<
  'TokenListController',
  TokenListController['state']
>;

type TokenListControllerStateChangeEvent = ControllerStateChangeEvent<
  'TokenListController',
  TokenListController['state']
>;

type AllowedActions =
  | AccountsControllerGetAccountAction
  | AccountsControllerGetSelectedAccountAction
  | KeyringControllerGetStateAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetNetworkConfigurationByNetworkClientId
  | NetworkControllerGetStateAction
  | PreferencesControllerGetStateAction
  | TokenListControllerGetStateAction
  | TokensControllerAddDetectedTokensAction
  | TokensControllerAddTokensAction
  | TokensControllerGetStateAction
  | AuthenticationController.AuthenticationControllerGetBearerToken;

type AllowedEvents =
  | AccountsControllerSelectedEvmAccountChangeEvent
  | KeyringControllerLockEvent
  | KeyringControllerUnlockEvent
  | NetworkControllerNetworkDidChangeEvent
  | NetworkControllerStateChangeEvent
  | PreferencesControllerStateChangeEvent
  | TokenListControllerStateChangeEvent
  | TransactionControllerTransactionConfirmedEvent;

export type TokenDetectionControllerMessenger = ReturnType<
  typeof getTokenDetectionControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * token detection controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getTokenDetectionControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const controllerMessenger = new Messenger<
    'TokenDetectionController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'TokenDetectionController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountsController:getAccount',
      'AccountsController:getSelectedAccount',
      'KeyringController:getState',
      'NetworkController:getNetworkClientById',
      'NetworkController:getNetworkConfigurationByNetworkClientId',
      'NetworkController:getState',
      'PreferencesController:getState',
      'TokenListController:getState',
      'TokensController:getState',
      'TokensController:addDetectedTokens',
      'TokensController:addTokens',
      'NetworkController:findNetworkClientIdByChainId',
      'AuthenticationController:getBearerToken',
    ],
    events: [
      'AccountsController:selectedEvmAccountChange',
      'KeyringController:lock',
      'KeyringController:unlock',
      'NetworkController:networkDidChange',
      'PreferencesController:stateChange',
      'TokenListController:stateChange',
      'TransactionController:transactionConfirmed',
    ],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  | AssetsContractControllerGetBalancesUsingMulticallAction
  | MetaMetricsControllerTrackEventAction
  | NetworkControllerGetStateAction
  | PreferencesControllerGetStateAction;

export type TokenDetectionControllerInitMessenger = ReturnType<
  typeof getTokenDetectionControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed during
 * initialization of the token detection controller.
 *
 * @param messenger
 */
export function getTokenDetectionControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'TokenDetectionControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'TokenDetectionControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'AssetsContractController:getBalancesUsingMulticall',
      'MetaMetricsController:trackEvent',
      'PreferencesController:getState',
    ],
  });
  return controllerInitMessenger;
}
