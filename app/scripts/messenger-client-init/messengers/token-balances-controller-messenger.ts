import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { TokenBalancesControllerMessenger } from '@metamask/assets-controllers';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type { PreferencesControllerGetStateAction } from '@metamask/preferences-controller';
import { OnboardingControllerGetStateAction } from '../../controllers/onboarding';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * token balances controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getTokenBalancesControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<TokenBalancesControllerMessenger>,
    MessengerEvents<TokenBalancesControllerMessenger>
  >,
): TokenBalancesControllerMessenger {
  const controllerMessenger: TokenBalancesControllerMessenger = new Messenger({
    namespace: 'TokenBalancesController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
      'PreferencesController:getState',
      'TokensController:getState',
      'TokenDetectionController:addDetectedTokensViaPolling',
      'TokenDetectionController:addDetectedTokensViaWs',
      'TokenDetectionController:detectTokens',
      'AccountsController:getSelectedAccount',
      'AccountsController:listAccounts',
      'AccountTrackerController:getState',
      'AccountTrackerController:updateNativeBalances',
      'AccountTrackerController:updateStakedBalances',
      'KeyringController:getState',
      'AuthenticationController:getBearerToken',
    ],
    events: [
      'NetworkController:stateChange',
      'PreferencesController:stateChange',
      'TokensController:stateChange',
      'KeyringController:accountRemoved',
      'KeyringController:lock',
      'KeyringController:unlock',
      'AccountActivityService:balanceUpdated',
      'AccountActivityService:statusChanged',
      'AccountsController:selectedEvmAccountChange',
      'TransactionController:transactionConfirmed',
      'TransactionController:incomingTransactionsReceived',
    ],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  | PreferencesControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction
  | OnboardingControllerGetStateAction;

export type TokenBalancesControllerInitMessenger = ReturnType<
  typeof getTokenBalancesControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed during
 * initialization of the token balances controller.
 *
 * @param messenger
 */
export function getTokenBalancesControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'TokenBalancesControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'TokenBalancesControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'PreferencesController:getState',
      'RemoteFeatureFlagController:getState',
      'OnboardingController:getState',
    ],
  });
  return controllerInitMessenger;
}
