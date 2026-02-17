import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import type { BridgeStatusControllerMessenger as BridgeStatusControllerBaseMessenger } from '@metamask/bridge-status-controller';
import { RootMessenger } from '../../lib/messenger';

export type BridgeStatusControllerMessenger =
  BridgeStatusControllerBaseMessenger;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * bridge status controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getBridgeStatusControllerMessenger(messenger: RootMessenger) {
  const controllerMessenger = new Messenger<
    'BridgeStatusController',
    MessengerActions<BridgeStatusControllerMessenger>,
    MessengerEvents<BridgeStatusControllerMessenger>,
    typeof messenger
  >({
    namespace: 'BridgeStatusController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountsController:getAccountByAddress',
      'NetworkController:getNetworkClientById',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getState',
      'BridgeController:trackUnifiedSwapBridgeEvent',
      'BridgeController:stopPollingForQuotes',
      'GasFeeController:getState',
      'SnapController:handleRequest',
      'TransactionController:getState',
      'RemoteFeatureFlagController:getState',
    ],
    events: [
      'TransactionController:transactionFailed',
      'TransactionController:transactionConfirmed',
    ],
  });
  return controllerMessenger;
}
