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
      'AuthenticationController:getBearerToken',
      'NetworkController:getNetworkClientById',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getState',
      'KeyringController:signTypedMessage',
      'BridgeController:trackUnifiedSwapBridgeEvent',
      'BridgeController:stopPollingForQuotes',
      'GasFeeController:getState',
      'RemoteFeatureFlagController:getState',
      'SnapController:handleRequest',
      'TransactionController:getState',
      'TransactionController:isAtomicBatchSupported',
      'TransactionController:addTransaction',
      'TransactionController:estimateGasFee',
      'TransactionController:updateTransaction',
    ],
    events: ['TransactionController:transactionStatusUpdated'],
  });
  return controllerMessenger;
}
