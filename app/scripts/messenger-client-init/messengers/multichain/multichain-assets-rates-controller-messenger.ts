import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { MultichainAssetsRatesControllerMessenger } from '@metamask/assets-controllers';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the Multichain Assets Rate controller. This is scoped to the
 * actions and events that the multichain Assets Rate controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getMultichainAssetsRatesControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<MultichainAssetsRatesControllerMessenger>,
    MessengerEvents<MultichainAssetsRatesControllerMessenger>
  >,
): MultichainAssetsRatesControllerMessenger {
  const controllerMessenger: MultichainAssetsRatesControllerMessenger =
    new Messenger({
      namespace: 'MultichainAssetsRatesController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: controllerMessenger,
    events: [
      'AccountsController:accountAdded',
      'KeyringController:lock',
      'KeyringController:unlock',
      'CurrencyRateController:stateChange',
      'MultichainAssetsController:accountAssetListUpdated',
    ],
    actions: [
      'AccountsController:listMultichainAccounts',
      'SnapController:handleRequest',
      'CurrencyRateController:getState',
      'MultichainAssetsController:getState',
      'AccountsController:getSelectedMultichainAccount',
    ],
  });
  return controllerMessenger;
}

type AllowedInitializationActions = RemoteFeatureFlagControllerGetStateAction;

export type MultichainAssetsRatesControllerInitMessenger = ReturnType<
  typeof getMultichainAssetsRatesControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions needed during
 * initialization of the Multichain Assets Rates controller.
 *
 * @param messenger - The base messenger used to create the restricted messenger.
 */
export function getMultichainAssetsRatesControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'MultichainAssetsRatesControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'MultichainAssetsRatesControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['RemoteFeatureFlagController:getState'],
    events: [],
  });
  return controllerInitMessenger;
}
