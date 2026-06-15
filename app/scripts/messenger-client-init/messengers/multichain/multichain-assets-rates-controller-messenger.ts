import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { MultichainAssetsRatesControllerMessenger } from '@metamask/assets-controllers';
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
