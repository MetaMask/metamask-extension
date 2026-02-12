import type {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
} from '@metamask/base-controller';
import { Messenger } from '@metamask/messenger';
import type {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import { AuthenticationController } from '@metamask/profile-sync-controller';
import {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerListAccountsAction,
  AccountsControllerSelectedEvmAccountChangeEvent,
} from '@metamask/accounts-controller';
import {
  AccountTrackerUpdateNativeBalancesAction,
  AccountTrackerUpdateStakedBalancesAction,
  AccountTrackerControllerGetStateAction,
  TokensControllerState,
  type TokenDetectionControllerAddDetectedTokensViaWsAction,
  TokenDetectionControllerAddDetectedTokensViaPollingAction,
  TokenDetectionControllerDetectTokensAction,
} from '@metamask/assets-controllers';
import {
  TransactionControllerIncomingTransactionsReceivedEvent,
  TransactionControllerTransactionConfirmedEvent,
} from '@metamask/transaction-controller';
import {
  KeyringControllerAccountRemovedEvent,
  KeyringControllerGetStateAction,
  KeyringControllerLockEvent,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type {
  AccountActivityServiceStatusChangedEvent,
  AccountActivityServiceBalanceUpdatedEvent,
} from '@metamask/core-backend';
import {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../controllers/preferences-controller';
import { OnboardingControllerGetStateAction } from '../../controllers/onboarding';
import { RootMessenger } from '../../lib/messenger';

// Not exported from `@metamask/assets-controllers`.
type TokensControllerGetStateAction = ControllerGetStateAction<
  'TokensController',
  TokensControllerState
>;

type TokensControllerStateChangeEvent = ControllerStateChangeEvent<
  'TokensController',
  TokensControllerState
>;

type AllowedActions =
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetStateAction
  | TokensControllerGetStateAction
  | TokenDetectionControllerAddDetectedTokensViaPollingAction
  | TokenDetectionControllerAddDetectedTokensViaWsAction
  | TokenDetectionControllerDetectTokensAction
  | PreferencesControllerGetStateAction
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerListAccountsAction
  | AccountTrackerControllerGetStateAction
  | AccountTrackerUpdateNativeBalancesAction
  | AccountTrackerUpdateStakedBalancesAction
  | KeyringControllerGetStateAction
  | AuthenticationController.AuthenticationControllerGetBearerToken;

type AllowedEvents =
  | TokensControllerStateChangeEvent
  | PreferencesControllerStateChangeEvent
  | NetworkControllerStateChangeEvent
  | KeyringControllerAccountRemovedEvent
  | KeyringControllerLockEvent
  | KeyringControllerUnlockEvent
  | AccountActivityServiceBalanceUpdatedEvent
  | AccountActivityServiceStatusChangedEvent
  | AccountsControllerSelectedEvmAccountChangeEvent
  | TransactionControllerTransactionConfirmedEvent
  | TransactionControllerIncomingTransactionsReceivedEvent;

export type TokenBalancesControllerMessenger = ReturnType<
  typeof getTokenBalancesControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * token balances controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getTokenBalancesControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const controllerMessenger = new Messenger<
    'TokenBalancesController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'TokenBalancesController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
      'PreferencesController:getState',
      'TokensController:getState',
      'TokenDetectionController:addDetectedTokensViaPolling',
      'TokenDetectionController:addDetectedTokensViaWs',
      'TokenDetectionController:detectTokens',
      'AccountsController:getSelectedAccount',
      'AccountsController:listAccounts',
      'AccountTrackerController:getState',
      'AccountTrackerController:updateNativeBalances',
      'AccountTrackerController:updateStakedBalances',
      'KeyringController:getState',
      'AuthenticationController:getBearerToken',
    ],
    events: [
      'NetworkController:stateChange',
      'PreferencesController:stateChange',
      'TokensController:stateChange',
      'KeyringController:accountRemoved',
      'KeyringController:lock',
      'KeyringController:unlock',
      'AccountActivityService:balanceUpdated',
      'AccountActivityService:statusChanged',
      'AccountsController:selectedEvmAccountChange',
      'TransactionController:transactionConfirmed',
      'TransactionController:incomingTransactionsReceived',
    ],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  | PreferencesControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction
  | OnboardingControllerGetStateAction;

export type TokenBalancesControllerInitMessenger = ReturnType<
  typeof getTokenBalancesControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed during
 * initialization of the token balances controller.
 *
 * @param messenger
 */
export function getTokenBalancesControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'TokenBalancesControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'TokenBalancesControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'PreferencesController:getState',
      'RemoteFeatureFlagController:getState',
      'OnboardingController:getState',
    ],
  });
  return controllerInitMessenger;
}
