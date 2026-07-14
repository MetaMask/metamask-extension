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
import { GasFeeControllerFetchGasFeeEstimatesAction } from '@metamask/gas-fee-controller';
import {
  KeyringControllerGetKeyringForAccountAction,
  KeyringControllerGetStateAction,
  KeyringControllerSignEip7702AuthorizationAction,
  KeyringControllerSignTransactionAction,
  KeyringControllerSignTypedMessageAction,
} from '@metamask/keyring-controller';
import { Messenger } from '@metamask/messenger';
import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetEIP1559CompatibilityAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetNetworkClientRegistryAction,
} from '@metamask/network-controller';
import type { AuthenticationController } from '@metamask/profile-sync-controller';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import {
  SmartTransactionsControllerGetFeesAction,
  SmartTransactionsControllerSmartTransactionEvent,
  SmartTransactionsControllerSubmitSignedTransactionsAction,
} from '@metamask/smart-transactions-controller';
import { SubscriptionControllerActions } from '@metamask/subscription-controller';
import {
  TransactionControllerAddTransactionAction,
  TransactionControllerAddTransactionBatchAction,
  TransactionControllerEstimateGasAction,
  TransactionControllerGetNonceLockAction,
  TransactionControllerGetStateAction,
  TransactionControllerIsAtomicBatchSupportedAction,
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
  TransactionPayControllerGetDelegationTransactionAction,
  TransactionPayControllerGetStateAction,
  TransactionPayControllerGetStrategyAction,
} from '@metamask/transaction-pay-controller';
import type {
  SentinelApiServiceCacheUpdatedEvent,
  SentinelApiServiceGranularCacheUpdatedEvent,
  SentinelApiServiceGetNetworksAction,
  SentinelApiServiceGetSmartTransactionAction,
  SentinelApiServiceInvalidateQueriesAction,
  SentinelApiServiceSimulateTransactionsAction,
  SentinelApiServiceSubmitRelayTransactionAction,
} from '@metamask-previews/sentinel-api-service';
import { RootMessenger } from '../../lib/messenger';
import { AppStateControllerGetStateAction } from '../../controllers/app-state-controller';
import { AppStateControllerSetDefaultHomeActiveTabNameAction } from '../../controllers/app-state-controller-method-action-types';
import { SubscriptionServiceSubmitSubscriptionSponsorshipIntentAction } from '../../services/subscription/types';
import {
  InstitutionalSnapControllerBeforeCheckPendingTransactionHookAction,
  InstitutionalSnapControllerPublishHookAction,
} from '../../controllers/institutional-snap/InstitutionalSnapController-method-action-types';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';

export type TransactionControllerInitMessenger = ReturnType<
  typeof getTransactionControllerInitMessenger
>;

export type TransactionControllerInitMessengerActions =
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerGetStateAction
  | AccountTrackerControllerGetStateAction
  | ApprovalControllerActions
  | AppStateControllerGetStateAction
  | AppStateControllerSetDefaultHomeActiveTabNameAction
  | AuthenticationController.AuthenticationControllerGetBearerTokenAction
  | BridgeStatusControllerActions
  | CurrencyRateControllerActions
  | DelegationControllerSignDelegationAction
  | GasFeeControllerFetchGasFeeEstimatesAction
  | InstitutionalSnapControllerPublishHookAction
  | InstitutionalSnapControllerBeforeCheckPendingTransactionHookAction
  | KeyringControllerGetKeyringForAccountAction
  | KeyringControllerGetStateAction
  | KeyringControllerSignEip7702AuthorizationAction
  | KeyringControllerSignTransactionAction
  | KeyringControllerSignTypedMessageAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetEIP1559CompatibilityAction
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetNetworkClientRegistryAction
  | PreferencesControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction
  | SentinelApiServiceGetNetworksAction
  | SentinelApiServiceGetSmartTransactionAction
  | SentinelApiServiceInvalidateQueriesAction
  | SentinelApiServiceSimulateTransactionsAction
  | SentinelApiServiceSubmitRelayTransactionAction
  | SmartTransactionsControllerGetFeesAction
  | SmartTransactionsControllerSubmitSignedTransactionsAction
  | SubscriptionControllerActions
  | SubscriptionServiceSubmitSubscriptionSponsorshipIntentAction
  | TransactionControllerAddTransactionAction
  | TransactionControllerAddTransactionBatchAction
  | TransactionControllerEstimateGasAction
  | TransactionControllerGetNonceLockAction
  | TransactionControllerGetStateAction
  | TransactionControllerIsAtomicBatchSupportedAction
  | TransactionControllerUpdateTransactionAction
  | TransactionPayControllerGetDelegationTransactionAction
  | TransactionPayControllerGetStateAction
  | TransactionPayControllerGetStrategyAction;

export type TransactionControllerInitMessengerEvents =
  | BridgeStatusControllerStateChangeEvent
  | SentinelApiServiceCacheUpdatedEvent
  | SentinelApiServiceGranularCacheUpdatedEvent
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

const transactionControllerInitMessengerCache = new WeakMap<
  RootMessenger<
    TransactionControllerInitMessengerActions,
    TransactionControllerInitMessengerEvents
  >,
  ReturnType<typeof getTransactionControllerInitMessenger>
>();

export function getTransactionControllerInitMessenger(
  messenger: RootMessenger<
    TransactionControllerInitMessengerActions,
    TransactionControllerInitMessengerEvents
  >,
) {
  if (transactionControllerInitMessengerCache.has(messenger)) {
    return transactionControllerInitMessengerCache.get(messenger)!;
  }
  const controllerInitMessenger = new Messenger<
    'TransactionControllerInit',
    TransactionControllerInitMessengerActions,
    TransactionControllerInitMessengerEvents,
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
      'AppStateController:setDefaultHomeActiveTabName',
      'AuthenticationController:getBearerToken',
      'BridgeStatusController:getState',
      'BridgeStatusController:submitTx',
      'CurrencyRateController:getState',
      'DelegationController:signDelegation',
      'InstitutionalSnapController:beforeCheckPendingTransactionHook',
      'InstitutionalSnapController:publishHook',
      'KeyringController:getKeyringForAccount',
      'KeyringController:getState',
      'KeyringController:signEip7702Authorization',
      'KeyringController:signTypedMessage',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getEIP1559Compatibility',
      'NetworkController:getNetworkClientById',
      'NetworkController:getNetworkClientRegistry',
      'PreferencesController:getState',
      'RemoteFeatureFlagController:getState',
      'SentinelApiService:getNetworks',
      'SentinelApiService:getSmartTransaction',
      'SentinelApiService:invalidateQueries',
      'SentinelApiService:simulateTransactions',
      'SentinelApiService:submitRelayTransaction',
      'SmartTransactionsController:getFees',
      'SmartTransactionsController:submitSignedTransactions',
      'SubscriptionController:getSubscriptionByProduct',
      'SubscriptionService:submitSubscriptionSponsorshipIntent',
      'TransactionController:addTransaction',
      'TransactionController:addTransactionBatch',
      'TransactionController:estimateGas',
      'TransactionController:getNonceLock',
      'TransactionController:getState',
      'TransactionController:isAtomicBatchSupported',
      'TransactionController:updateTransaction',
      'TransactionPayController:getDelegationTransaction',
      'TransactionPayController:getState',
      'TransactionPayController:getStrategy',
    ],
  });

  transactionControllerInitMessengerCache.set(
    messenger,
    controllerInitMessenger,
  );
  return controllerInitMessenger;
}
