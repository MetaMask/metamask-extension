import { Messenger } from '@metamask/base-controller';
import type { AccountsControllerGetSelectedMultichainAccountAction } from '@metamask/accounts-controller';
import type {
  GetCurrencyRateState,
  MultichainAssetsRatesControllerGetStateAction,
  TokenRatesControllerGetStateAction,
} from '@metamask/assets-controllers';
import type { HandleSnapRequest } from '@metamask/snaps-controllers';
import type {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller';

type AllowedActions =
  | AccountsControllerGetSelectedMultichainAccountAction
  | GetCurrencyRateState
  | TokenRatesControllerGetStateAction
  | MultichainAssetsRatesControllerGetStateAction
  | HandleSnapRequest
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetStateAction
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
  messenger: Messenger<AllowedActions, never>,
) {
  return messenger.getRestricted({
    name: 'BridgeController',
    allowedActions: [
      'AccountsController:getSelectedMultichainAccount',
      'SnapController:handleRequest',
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
      'NetworkController:findNetworkClientIdByChainId',
      'TokenRatesController:getState',
      'MultichainAssetsRatesController:getState',
      'RemoteFeatureFlagController:getState',
      'CurrencyRateController:getState',
    ],
    allowedEvents: [],
  });
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
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'BridgeControllerInit',
    allowedActions: ['MetaMetricsController:trackEvent'],
    allowedEvents: [],
  });
}
