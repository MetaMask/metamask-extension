import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { BridgeStatusControllerMessenger } from '@metamask/bridge-status-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * bridge status controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getBridgeStatusControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<BridgeStatusControllerMessenger>,
    MessengerEvents<BridgeStatusControllerMessenger>
  >,
) {
  const controllerMessenger: BridgeStatusControllerMessenger = new Messenger({
    namespace: 'BridgeStatusController',
    parent: messenger,
  });

  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountsController:getAccountByAddress',
      'ApprovalController:acceptRequest',
      'ApprovalController:rejectRequest',
      'AssetsController:addCustomAsset',
      'AssetsController:getAssets',
      'AuthenticationController:getBearerToken',
      'BridgeController:fetchQuotes',
      'BridgeController:getState',
      'BridgeController:stopPollingForQuotes',
      'BridgeController:trackUnifiedSwapBridgeEvent',
      'KeyringController:signTypedMessage',
      'MoneyAccountController:getMoneyAccount',
      'NetworkController:getNetworkClientById',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getState',
      'RemoteFeatureFlagController:getState',
      'SnapController:handleRequest',
      'TransactionController:addTransaction',
      'TransactionController:estimateGasFee',
      'TransactionController:getState',
      'TransactionController:isAtomicBatchSupported',
      'TransactionController:updateTransaction',
      'TransactionPayController:setTransactionConfig',
      'TransactionPayController:updatePaymentToken',
    ],
    events: [
      'TransactionController:transactionStatusUpdated',
      'TransactionController:unapprovedTransactionAdded',
      'TransactionPayController:stateChange',
    ],
  });
  return controllerMessenger;
}
