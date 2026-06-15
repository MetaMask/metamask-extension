import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { NftDetectionControllerMessenger } from '@metamask/assets-controllers';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the NFT detection controller. This is scoped to the
 * actions and events that the NFT controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getNftDetectionControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<NftDetectionControllerMessenger>,
    MessengerEvents<NftDetectionControllerMessenger>
  >,
): NftDetectionControllerMessenger {
  const controllerMessenger: NftDetectionControllerMessenger = new Messenger({
    namespace: 'NftDetectionController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    events: [
      'NetworkController:stateChange',
      'PreferencesController:stateChange',
    ],
    actions: [
      'ApprovalController:addRequest',
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
      'AccountsController:getSelectedAccount',
      'NetworkController:findNetworkClientIdByChainId',
    ],
  });
  return controllerMessenger;
}
