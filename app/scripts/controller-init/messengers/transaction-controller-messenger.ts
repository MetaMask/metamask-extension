import { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import { ApprovalControllerActions } from '@metamask/approval-controller';
import { ControllerMessenger } from '@metamask/base-controller';
import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import {
  TransactionControllerPostTransactionBalanceUpdatedEvent,
  TransactionControllerTransactionApprovedEvent,
  TransactionControllerTransactionConfirmedEvent,
  TransactionControllerTransactionDroppedEvent,
  TransactionControllerTransactionFailedEvent,
  TransactionControllerTransactionNewSwapApprovalEvent,
  TransactionControllerTransactionNewSwapEvent,
  TransactionControllerTransactionRejectedEvent,
  TransactionControllerTransactionStatusUpdatedEvent,
  TransactionControllerTransactionSubmittedEvent,
  TransactionControllerUnapprovedTransactionAddedEvent,
} from '@metamask/transaction-controller';
import {
  SwapsControllerSetApproveTxIdAction,
  SwapsControllerSetTradeTxIdAction,
} from '../../controllers/swaps/swaps.types';

type MessengerActions =
  | ApprovalControllerActions
  | AccountsControllerGetSelectedAccountAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetNetworkClientByIdAction
  | SwapsControllerSetApproveTxIdAction
  | SwapsControllerSetTradeTxIdAction;

type MessengerEvents =
  | TransactionControllerTransactionApprovedEvent
  | TransactionControllerTransactionConfirmedEvent
  | TransactionControllerTransactionDroppedEvent
  | TransactionControllerTransactionFailedEvent
  | TransactionControllerTransactionNewSwapApprovalEvent
  | TransactionControllerTransactionNewSwapEvent
  | TransactionControllerTransactionRejectedEvent
  | TransactionControllerTransactionStatusUpdatedEvent
  | TransactionControllerTransactionSubmittedEvent
  | TransactionControllerPostTransactionBalanceUpdatedEvent
  | TransactionControllerUnapprovedTransactionAddedEvent
  | NetworkControllerStateChangeEvent;

export type TransactionControllerInitMessenger = ReturnType<
  typeof getTransactionControllerMessenger
>;

export function getTransactionControllerMessenger(
  controllerMessenger: ControllerMessenger<MessengerActions, MessengerEvents>,
) {
  return controllerMessenger.getRestricted({
    name: 'TransactionController',
    allowedEvents: [
      'NetworkController:stateChange',
      'TransactionController:transactionApproved',
      'TransactionController:transactionConfirmed',
      'TransactionController:transactionDropped',
      'TransactionController:transactionFailed',
      'TransactionController:transactionNewSwapApproval',
      'TransactionController:transactionNewSwap',
      'TransactionController:transactionRejected',
      'TransactionController:transactionStatusUpdated',
      'TransactionController:transactionSubmitted',
      'TransactionController:postTransactionBalanceUpdated',
      'TransactionController:unapprovedTransactionAdded',
      // Temporary to support client subscriptions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any,
    allowedActions: [
      'ApprovalController:addRequest',
      'AccountsController:getSelectedAccount',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getNetworkClientById',
      'SwapsController:setApproveTxId',
      'SwapsController:setTradeTxId',
    ],
  });
}
