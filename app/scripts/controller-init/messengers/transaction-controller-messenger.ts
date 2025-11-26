import {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerGetStateAction,
} from '@metamask/accounts-controller';
import { ApprovalControllerActions } from '@metamask/approval-controller';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import {
  KeyringControllerSignEip7702AuthorizationAction,
  KeyringControllerSignTypedMessageAction,
} from '@metamask/keyring-controller';
import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetEIP1559CompatibilityAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import type { AuthenticationController } from '@metamask/profile-sync-controller';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { SmartTransactionsControllerSmartTransactionEvent } from '@metamask/smart-transactions-controller';
import {
  TransactionControllerEstimateGasAction,
  TransactionControllerGetStateAction,
  TransactionControllerMessenger,
  TransactionControllerPostTransactionBalanceUpdatedEvent,
  TransactionControllerTransactionApprovedEvent,
  TransactionControllerTransactionConfirmedEvent,
  TransactionControllerTransactionDroppedEvent,
  TransactionControllerTransactionFailedEvent,
  TransactionControllerTransactionNewSwapApprovalEvent,
  TransactionControllerTransactionNewSwapEvent,
  TransactionControllerTransactionRejectedEvent,
  TransactionControllerTransactionSubmittedEvent,
  TransactionControllerUnapprovedTransactionAddedEvent,
} from '@metamask/transaction-controller';
import { SubscriptionControllerActions } from '@metamask/subscription-controller';
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
  | ApprovalControllerActions
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerGetStateAction
  | AppStateControllerGetStateAction
  | AuthenticationController.AuthenticationControllerGetBearerToken
  | DelegationControllerSignDelegationAction
  | InstitutionalSnapControllerPublishHookAction
  | InstitutionalSnapControllerBeforeCheckPendingTransactionHookAction
  | KeyringControllerSignEip7702AuthorizationAction
  | KeyringControllerSignTypedMessageAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetEIP1559CompatibilityAction
  | NetworkControllerGetNetworkClientByIdAction
  | RemoteFeatureFlagControllerGetStateAction
  | SwapsControllerSetApproveTxIdAction
  | SwapsControllerSetTradeTxIdAction
  | TransactionControllerEstimateGasAction
  | TransactionControllerGetStateAction
  | SubscriptionControllerActions
  | SubscriptionServiceAction;

type InitMessengerEvents =
  | TransactionControllerTransactionApprovedEvent
  | TransactionControllerTransactionConfirmedEvent
  | TransactionControllerTransactionDroppedEvent
  | TransactionControllerTransactionFailedEvent
  | TransactionControllerTransactionNewSwapApprovalEvent
  | TransactionControllerTransactionNewSwapEvent
  | TransactionControllerTransactionRejectedEvent
  | TransactionControllerTransactionSubmittedEvent
  | TransactionControllerPostTransactionBalanceUpdatedEvent
  | TransactionControllerUnapprovedTransactionAddedEvent
  | NetworkControllerStateChangeEvent
  | SmartTransactionsControllerSmartTransactionEvent;

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
      'SmartTransactionsController:smartTransaction',
      'TransactionController:transactionApproved',
      'TransactionController:transactionConfirmed',
      'TransactionController:transactionDropped',
      'TransactionController:transactionFailed',
      'TransactionController:transactionNewSwapApproval',
      'TransactionController:transactionNewSwap',
      'TransactionController:transactionRejected',
      'TransactionController:transactionSubmitted',
      'TransactionController:postTransactionBalanceUpdated',
      'TransactionController:unapprovedTransactionAdded',
    ],
    actions: [
      'ApprovalController:acceptRequest',
      'ApprovalController:addRequest',
      'ApprovalController:endFlow',
      'ApprovalController:startFlow',
      'ApprovalController:updateRequestState',
      'AppStateController:getState',
      'AuthenticationController:getBearerToken',
      'DelegationController:signDelegation',
      'InstitutionalSnapController:beforeCheckPendingTransactionHook',
      'InstitutionalSnapController:publishHook',
      'KeyringController:signEip7702Authorization',
      'KeyringController:signTypedMessage',
      'NetworkController:getEIP1559Compatibility',
      'RemoteFeatureFlagController:getState',
      'SwapsController:setApproveTxId',
      'SwapsController:setTradeTxId',
      'TransactionController:estimateGas',
      'TransactionController:getState',
      'SubscriptionController:getSubscriptionByProduct',
      'SubscriptionService:submitSubscriptionSponsorshipIntent',
    ],
  });
  return controllerInitMessenger;
}
