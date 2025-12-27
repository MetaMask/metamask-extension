import { Messenger } from '@metamask/messenger';
import type {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetNetworkConfigurationByNetworkClientId,
  NetworkControllerGetStateAction,
  NetworkControllerNetworkDidChangeEvent,
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
  TokensControllerAddDetectedTokensAction,
  TokensControllerAddTokensAction,
  TokensControllerGetStateAction,
  AssetsContractControllerGetBalancesInSingleCallAction,
  TokenListStateChange,
  GetTokenListState,
} from '@metamask/assets-controllers';
import { TransactionControllerTransactionConfirmedEvent } from '@metamask/transaction-controller';
import {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../controllers/preferences-controller';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions =
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerGetAccountAction
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetNetworkConfigurationByNetworkClientId
  | NetworkControllerGetStateAction
  | GetTokenListState
  | KeyringControllerGetStateAction
  | PreferencesControllerGetStateAction
  | TokensControllerGetStateAction
  | TokensControllerAddDetectedTokensAction
  | TokensControllerAddTokensAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | AuthenticationController.AuthenticationControllerGetBearerToken;

type AllowedEvents =
  | AccountsControllerSelectedEvmAccountChangeEvent
  | NetworkControllerNetworkDidChangeEvent
  | TokenListStateChange
  | KeyringControllerLockEvent
  | KeyringControllerUnlockEvent
  | PreferencesControllerStateChangeEvent
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
      'TokensController:getState',
      'TokensController:addDetectedTokens',
      'TokenListController:getState',
      'PreferencesController:getState',
      'TokensController:addTokens',
      'NetworkController:findNetworkClientIdByChainId',
      'AuthenticationController:getBearerToken',
    ],
    events: [
      'AccountsController:selectedEvmAccountChange',
      'KeyringController:lock',
      'KeyringController:unlock',
      'NetworkController:networkDidChange',
      'TokenListController:stateChange',
      'PreferencesController:stateChange',
      'TransactionController:transactionConfirmed',
    ],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  | AssetsContractControllerGetBalancesInSingleCallAction
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
      'AssetsContractController:getBalancesInSingleCall',
      'MetaMetricsController:trackEvent',
      'PreferencesController:getState',
    ],
  });
  return controllerInitMessenger;
}
