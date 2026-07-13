import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';

import { RootMessenger } from '../../lib/messenger';
import type { StellarAssetsControllerMessenger } from '../../controllers/stellar-assets-controller';

/**
 * Get a restricted messenger for the Stellar Assets controller.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getStellarAssetsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<StellarAssetsControllerMessenger>,
    MessengerEvents<StellarAssetsControllerMessenger>
  >,
): StellarAssetsControllerMessenger {
  const controllerMessenger: StellarAssetsControllerMessenger = new Messenger({
    namespace: 'StellarAssetsController',
    parent: messenger,
  });

  messenger.delegate({
    messenger: controllerMessenger,
    events: [
      'AccountsController:accountRemoved',
      'AccountsController:accountAssetListUpdated',
    ],
    actions: [
      'AccountsController:listMultichainAccounts',
      'SnapController:handleRequest',
      'KeyringController:getState',
    ],
  });

  return controllerMessenger;
}

type AllowedInitializationActions = RemoteFeatureFlagControllerGetStateAction;

export type StellarAssetsControllerInitMessenger = ReturnType<
  typeof getStellarAssetsControllerInitMessenger
>;

/**
 * Get a restricted init messenger for the Stellar Assets controller.
 *
 * @param messenger - The root messenger to restrict.
 * @returns The restricted init messenger.
 */
export function getStellarAssetsControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'StellarAssetsControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'StellarAssetsControllerInit',
    parent: messenger,
  });

  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['RemoteFeatureFlagController:getState'],
  });

  return controllerInitMessenger;
}
