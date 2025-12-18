import { Messenger } from '@metamask/messenger';
import type { AccountsControllerGetAccountByAddressAction } from '@metamask/accounts-controller';
import type {
  GetCurrencyRateState,
  MultichainAssetsRatesControllerGetStateAction,
  TokenRatesControllerGetStateAction,
} from '@metamask/assets-controllers';
import type { HandleSnapRequest } from '@metamask/snaps-controllers';
import type {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions =
  | AccountsControllerGetAccountByAddressAction
  | GetCurrencyRateState
  | TokenRatesControllerGetStateAction
  | MultichainAssetsRatesControllerGetStateAction
  | HandleSnapRequest
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetNetworkClientByIdAction
  | RemoteFeatureFlagControllerGetStateAction;

export type BridgeControllerMessenger = ReturnType<
  typeof getBridgeControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * bridge controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getBridgeControllerMessenger(
  messenger: RootMessenger<AllowedActions, never>,
) {
  const controllerMessenger = new Messenger<
    'BridgeController',
    AllowedActions,
    never,
    typeof messenger
  >({
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
    ],
  });
  return controllerMessenger;
}

type AllowedInitializationActions = MetaMetricsControllerTrackEventAction;

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
    actions: ['MetaMetricsController:trackEvent'],
  });
  return controllerInitMessenger;
}
