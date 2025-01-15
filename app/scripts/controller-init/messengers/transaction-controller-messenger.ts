import { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import { ApprovalControllerActions } from '@metamask/approval-controller';
import { ControllerMessenger } from '@metamask/base-controller';
import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetEIP1559CompatibilityAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import {
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
import {
  SwapsControllerSetApproveTxIdAction,
  SwapsControllerSetTradeTxIdAction,
} from '../../controllers/swaps/swaps.types';

type MessengerActions =
  | ApprovalControllerActions
  | AccountsControllerGetSelectedAccountAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetEIP1559CompatibilityAction
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
  | TransactionControllerTransactionSubmittedEvent
  | TransactionControllerPostTransactionBalanceUpdatedEvent
  | TransactionControllerUnapprovedTransactionAddedEvent
  | NetworkControllerStateChangeEvent
  | SmartTransactionsControllerSmartTransactionEvent;

export type TransactionControllerInitMessenger = ReturnType<
  typeof getTransactionControllerInitMessenger
>;

export function getTransactionControllerMessenger(
  controllerMessenger: ControllerMessenger<MessengerActions, MessengerEvents>,
): TransactionControllerMessenger {
  return controllerMessenger.getRestricted({
    name: 'TransactionController',
    allowedActions: [
      'AccountsController:getSelectedAccount',
      `ApprovalController:addRequest`,
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getNetworkClientById',
    ],
    allowedEvents: [`NetworkController:stateChange`],
  });
}

export function getTransactionControllerInitMessenger(
  controllerMessenger: ControllerMessenger<MessengerActions, MessengerEvents>,
) {
  return controllerMessenger.getRestricted({
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
      'NetworkController:getEIP1559Compatibility',
      'SwapsController:setApproveTxId',
      'SwapsController:setTradeTxId',
    ],
  });
}
