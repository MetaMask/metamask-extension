import {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerGetStateAction,
} from '@metamask/accounts-controller';
import { ApprovalControllerActions } from '@metamask/approval-controller';
import { Messenger } from '@metamask/base-controller';
import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetEIP1559CompatibilityAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
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
import { SmartTransactionsControllerSmartTransactionEvent } from '@metamask/smart-transactions-controller';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import {
  KeyringControllerSignEip7702AuthorizationAction,
  KeyringControllerSignTypedMessageAction,
} from '@metamask/keyring-controller';
import { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import type { AuthenticationController } from '@metamask/profile-sync-controller';
import {
  SwapsControllerSetApproveTxIdAction,
  SwapsControllerSetTradeTxIdAction,
} from '../../controllers/swaps/swaps.types';
import { AppStateControllerGetStateAction } from '../../controllers/app-state-controller';
import {
  InstitutionalSnapControllerPublishHookAction,
  InstitutionalSnapControllerBeforeCheckPendingTransactionHookAction,
} from './accounts/institutional-snap-controller-messenger';

type MessengerActions =
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
  | TransactionControllerGetStateAction;

type MessengerEvents =
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

export type TransactionControllerInitMessenger = ReturnType<
  typeof getTransactionControllerInitMessenger
>;

export function getTransactionControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
): TransactionControllerMessenger {
  return messenger.getRestricted({
    name: 'TransactionController',
    allowedActions: [
      'AccountsController:getSelectedAccount',
      'AccountsController:getState',
      `ApprovalController:addRequest`,
      'KeyringController:signEip7702Authorization',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getNetworkClientById',
      'RemoteFeatureFlagController:getState',
    ],
    allowedEvents: [`NetworkController:stateChange`],
  });
}

export function getTransactionControllerInitMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
) {
  return messenger.getRestricted({
    name: 'TransactionControllerInit',
    allowedEvents: [
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
      'SmartTransactionsController:smartTransaction',
    ],
    allowedActions: [
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
    ],
  });
}
