import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import {
  TokenDetectionControllerMessenger,
  AssetsContractControllerGetBalancesInSingleCallAction,
} from '@metamask/assets-controllers';
import type { NetworkControllerGetStateAction } from '@metamask/network-controller';
import type { PreferencesControllerGetStateAction } from '@metamask/preferences-controller';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller-method-action-types';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * token detection controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getTokenDetectionControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<TokenDetectionControllerMessenger>,
    MessengerEvents<TokenDetectionControllerMessenger>
  >,
): TokenDetectionControllerMessenger {
  const controllerMessenger: TokenDetectionControllerMessenger = new Messenger({
    namespace: 'TokenDetectionController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountsController:getAccount',
      'AccountsController:getSelectedAccount',
      'KeyringController:getState',
      'NetworkController:getNetworkClientById',
      'NetworkController:getNetworkConfigurationByNetworkClientId',
      'NetworkController:getState',
      'TokensController:getState',
      'TokensController:addDetectedTokens',
      'PreferencesController:getState',
      'TokensController:addTokens',
      'NetworkController:findNetworkClientIdByChainId',
      'AuthenticationController:getBearerToken',
    ],
    events: [
      'AccountsController:selectedEvmAccountChange',
      'KeyringController:lock',
      'KeyringController:unlock',
      'NetworkController:networkDidChange',
      'PreferencesController:stateChange',
      'TransactionController:transactionConfirmed',
    ],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  | AssetsContractControllerGetBalancesInSingleCallAction
  | MetaMetricsControllerTrackEventAction
  | NetworkControllerGetStateAction
  | PreferencesControllerGetStateAction;

export type TokenDetectionControllerInitMessenger = ReturnType<
  typeof getTokenDetectionControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed during
 * initialization of the token detection controller.
 *
 * @param messenger
 */
export function getTokenDetectionControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'TokenDetectionControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'TokenDetectionControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'AssetsContractController:getBalancesInSingleCall',
      'MetaMetricsController:trackEvent',
      'PreferencesController:getState',
    ],
  });
  return controllerInitMessenger;
}
