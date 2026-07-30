import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { BridgeControllerMessenger } from '@metamask/bridge-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * bridge controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getBridgeControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<BridgeControllerMessenger>,
    MessengerEvents<BridgeControllerMessenger>
  >,
) {
  const controllerMessenger: BridgeControllerMessenger = new Messenger({
    namespace: 'BridgeController',
    parent: messenger,
  });

  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountsController:getAccountByAddress',
      'SnapController:handleRequest',
      'NetworkController:getNetworkClientById',
      'NetworkController:findNetworkClientIdByChainId',
      'TokenRatesController:getState',
      'MultichainAssetsRatesController:getState',
      'RemoteFeatureFlagController:getState',
      'CurrencyRateController:getState',
      'AuthenticationController:getBearerToken',
      'AssetsController:getExchangeRatesForBridge',
    ],
  });
  return controllerMessenger;
}

type AllowedInitializationActions = never;

export type BridgeControllerInitMessenger = ReturnType<
  typeof getBridgeControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the bridge controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getBridgeControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'BridgeControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'BridgeControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [],
  });
  return controllerInitMessenger;
}
