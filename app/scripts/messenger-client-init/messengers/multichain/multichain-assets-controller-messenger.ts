import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { MultichainAssetsControllerMessenger } from '@metamask/assets-controllers';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the Multichain Assets controller. This is scoped to the
 * actions and events that the multichain Assets controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getMultichainAssetsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<MultichainAssetsControllerMessenger>,
    MessengerEvents<MultichainAssetsControllerMessenger>
  >,
) {
  const controllerMessenger: MultichainAssetsControllerMessenger =
    new Messenger({
      namespace: 'MultichainAssetsController',
      parent: messenger,
    });

  messenger.delegate({
    messenger: controllerMessenger,
    events: [
      'AccountsController:accountAdded',
      'AccountsController:accountRemoved',
      'AccountsController:accountAssetListUpdated',
    ],
    actions: [
      'PermissionController:getPermissions',
      'SnapController:handleRequest',
      'SnapController:getRunnableSnaps',
      'AccountsController:listMultichainAccounts',
      'PhishingController:bulkScanTokens',
    ],
  });

  return controllerMessenger;
}
