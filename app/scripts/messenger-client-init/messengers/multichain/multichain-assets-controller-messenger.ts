import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { MultichainAssetsControllerMessenger } from '@metamask/assets-controllers';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
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

type AllowedInitializationActions = RemoteFeatureFlagControllerGetStateAction;

export type MultichainAssetsControllerInitMessenger = ReturnType<
  typeof getMultichainAssetsControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions needed during
 * initialization of the Multichain Assets controller.
 *
 * @param messenger - The base messenger used to create the restricted messenger.
 */
export function getMultichainAssetsControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'MultichainAssetsControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'MultichainAssetsControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['RemoteFeatureFlagController:getState'],
  });
  return controllerInitMessenger;
}
