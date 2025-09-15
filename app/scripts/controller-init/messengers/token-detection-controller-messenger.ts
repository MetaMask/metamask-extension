import {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  Messenger,
} from '@metamask/base-controller';
import type {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetNetworkConfigurationByNetworkClientId,
  NetworkControllerGetStateAction,
  NetworkControllerNetworkDidChangeEvent,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
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
} from '@metamask/assets-controllers';
import { TransactionControllerTransactionConfirmedEvent } from '@metamask/transaction-controller';
import {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../controllers/preferences-controller';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller';

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
  | TokensControllerGetStateAction;

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
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'TokenDetectionController',
    allowedActions: [
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
    ],
    allowedEvents: [
      'AccountsController:selectedEvmAccountChange',
      'KeyringController:lock',
      'KeyringController:unlock',
      'NetworkController:networkDidChange',
      'PreferencesController:stateChange',
      'TokenListController:stateChange',
      'TransactionController:transactionConfirmed',
    ],
  });
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
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'TokenDetectionControllerInit',
    allowedActions: [
      'AssetsContractController:getBalancesInSingleCall',
      'MetaMetricsController:trackEvent',
      'PreferencesController:getState',
    ],
    allowedEvents: [],
  });
}
