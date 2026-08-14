import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { MultichainBalancesControllerMessenger } from '@metamask/assets-controllers';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the Multichain Balances controller. This is scoped to the
 * actions and events that the Multichain Balances controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getMultichainBalancesControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<MultichainBalancesControllerMessenger>,
    MessengerEvents<MultichainBalancesControllerMessenger>
  >,
): MultichainBalancesControllerMessenger {
  const controllerMessenger: MultichainBalancesControllerMessenger =
    new Messenger({
      namespace: 'MultichainBalancesController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: controllerMessenger,
    events: [
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
      'AccountsController:accountBalancesUpdated',
      'MultichainAssetsController:accountAssetListUpdated',
    ],
    actions: [
      'AccountsController:listMultichainAccounts',
      'SnapController:handleRequest',
      'MultichainAssetsController:getState',
      'KeyringController:getState',
    ],
  });
  return controllerMessenger;
}
