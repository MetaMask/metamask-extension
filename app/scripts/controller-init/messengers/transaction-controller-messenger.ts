import {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerGetStateAction,
} from '@metamask/accounts-controller';
import { ApprovalControllerActions } from '@metamask/approval-controller';
import {
  AccountTrackerControllerGetStateAction,
  CurrencyRateControllerActions,
} from '@metamask/assets-controllers';
import {
  BridgeStatusControllerActions,
  BridgeStatusControllerStateChangeEvent,
} from '@metamask/bridge-status-controller';
import { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import {
  KeyringControllerSignEip7702AuthorizationAction,
  KeyringControllerSignTypedMessageAction,
} from '@metamask/keyring-controller';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetEIP1559CompatibilityAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import type { AuthenticationController } from '@metamask/profile-sync-controller';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { SmartTransactionsControllerSmartTransactionEvent } from '@metamask/smart-transactions-controller';
import { SubscriptionControllerActions } from '@metamask/subscription-controller';
import {
  TransactionControllerAddTransactionAction,
  TransactionControllerAddTransactionBatchAction,
  TransactionControllerEstimateGasAction,
  TransactionControllerGetStateAction,
  TransactionControllerMessenger,
  TransactionControllerPostTransactionBalanceUpdatedEvent,
  TransactionControllerStateChangeEvent,
  TransactionControllerTransactionApprovedEvent,
  TransactionControllerTransactionConfirmedEvent,
  TransactionControllerTransactionDroppedEvent,
  TransactionControllerTransactionFailedEvent,
  TransactionControllerTransactionNewSwapApprovalEvent,
  TransactionControllerTransactionNewSwapEvent,
  TransactionControllerTransactionRejectedEvent,
  TransactionControllerTransactionSubmittedEvent,
  TransactionControllerUnapprovedTransactionAddedEvent,
  TransactionControllerUpdateTransactionAction,
} from '@metamask/transaction-controller';
import {
  TransactionPayControllerGetStateAction,
  TransactionPayControllerGetStrategyAction,
} from '@metamask/transaction-pay-controller';
import { RootMessenger } from '../../lib/messenger';
import { AppStateControllerGetStateAction } from '../../controllers/app-state-controller';
import {
  SwapsControllerSetApproveTxIdAction,
  SwapsControllerSetTradeTxIdAction,
} from '../../controllers/swaps/swaps.types';
import { SubscriptionServiceAction } from '../../services/subscription/types';
import {
  InstitutionalSnapControllerBeforeCheckPendingTransactionHookAction,
  InstitutionalSnapControllerPublishHookAction,
} from './accounts/institutional-snap-controller-messenger';

type AllowedActions = MessengerActions<TransactionControllerMessenger>;

type AllowedEvents = MessengerEvents<TransactionControllerMessenger>;

export type TransactionControllerInitMessenger = ReturnType<
  typeof getTransactionControllerInitMessenger
>;

export function getTransactionControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
): TransactionControllerMessenger {
  const controllerMessenger = new Messenger<
    'TransactionController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'TransactionController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountsController:getSelectedAccount',
      'AccountsController:getState',
      `ApprovalController:addRequest`,
      'KeyringController:signEip7702Authorization',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getNetworkClientById',
      'RemoteFeatureFlagController:getState',
    ],
    events: [`NetworkController:stateChange`],
  });
  return controllerMessenger;
}

type InitMessengerActions =
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerGetStateAction
  | AccountTrackerControllerGetStateAction
  | ApprovalControllerActions
  | AppStateControllerGetStateAction
  | AuthenticationController.AuthenticationControllerGetBearerToken
  | BridgeStatusControllerActions
  | CurrencyRateControllerActions
  | DelegationControllerSignDelegationAction
  | InstitutionalSnapControllerPublishHookAction
  | InstitutionalSnapControllerBeforeCheckPendingTransactionHookAction
  | KeyringControllerSignEip7702AuthorizationAction
  | KeyringControllerSignTypedMessageAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetEIP1559CompatibilityAction
  | NetworkControllerGetNetworkClientByIdAction
  | RemoteFeatureFlagControllerGetStateAction
  | SubscriptionControllerActions
  | SubscriptionServiceAction
  | SwapsControllerSetApproveTxIdAction
  | SwapsControllerSetTradeTxIdAction
  | TransactionControllerAddTransactionAction
  | TransactionControllerAddTransactionBatchAction
  | TransactionControllerEstimateGasAction
  | TransactionControllerGetStateAction
  | TransactionControllerUpdateTransactionAction
  | TransactionPayControllerGetStateAction
  | TransactionPayControllerGetStrategyAction;

type InitMessengerEvents =
  | BridgeStatusControllerStateChangeEvent
  | NetworkControllerStateChangeEvent
  | SmartTransactionsControllerSmartTransactionEvent
  | TransactionControllerPostTransactionBalanceUpdatedEvent
  | TransactionControllerStateChangeEvent
  | TransactionControllerTransactionApprovedEvent
  | TransactionControllerTransactionConfirmedEvent
  | TransactionControllerTransactionDroppedEvent
  | TransactionControllerTransactionFailedEvent
  | TransactionControllerTransactionNewSwapApprovalEvent
  | TransactionControllerTransactionNewSwapEvent
  | TransactionControllerTransactionRejectedEvent
  | TransactionControllerTransactionSubmittedEvent
  | TransactionControllerUnapprovedTransactionAddedEvent;

export function getTransactionControllerInitMessenger(
  messenger: RootMessenger<InitMessengerActions, InitMessengerEvents>,
) {
  const controllerInitMessenger = new Messenger<
    'TransactionControllerInit',
    InitMessengerActions,
    InitMessengerEvents,
    typeof messenger
  >({
    namespace: 'TransactionControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    events: [
      'BridgeStatusController:stateChange',
      'SmartTransactionsController:smartTransaction',
      'TransactionController:postTransactionBalanceUpdated',
      'TransactionController:stateChange',
      'TransactionController:transactionApproved',
      'TransactionController:transactionConfirmed',
      'TransactionController:transactionDropped',
      'TransactionController:transactionFailed',
      'TransactionController:transactionNewSwapApproval',
      'TransactionController:transactionNewSwap',
      'TransactionController:transactionRejected',
      'TransactionController:transactionSubmitted',
      'TransactionController:unapprovedTransactionAdded',
    ],
    actions: [
      'AccountTrackerController:getState',
      'ApprovalController:acceptRequest',
      'ApprovalController:addRequest',
      'ApprovalController:endFlow',
      'ApprovalController:startFlow',
      'ApprovalController:updateRequestState',
      'AppStateController:getState',
      'AuthenticationController:getBearerToken',
      'BridgeStatusController:getState',
      'BridgeStatusController:submitTx',
      'CurrencyRateController:getState',
      'DelegationController:signDelegation',
      'InstitutionalSnapController:beforeCheckPendingTransactionHook',
      'InstitutionalSnapController:publishHook',
      'KeyringController:signEip7702Authorization',
      'KeyringController:signTypedMessage',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getEIP1559Compatibility',
      'NetworkController:getNetworkClientById',
      'RemoteFeatureFlagController:getState',
      'SubscriptionController:getSubscriptionByProduct',
      'SubscriptionService:submitSubscriptionSponsorshipIntent',
      'SwapsController:setApproveTxId',
      'SwapsController:setTradeTxId',
      'TransactionController:addTransaction',
      'TransactionController:addTransactionBatch',
      'TransactionController:estimateGas',
      'TransactionController:getState',
      'TransactionController:updateTransaction',
      'TransactionPayController:getState',
      'TransactionPayController:getStrategy',
    ],
  });
  return controllerInitMessenger;
}
