import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { NftControllerMessenger } from '@metamask/assets-controllers';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the NFT controller. This is scoped to the
 * actions and events that the NFT controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getNftControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<NftControllerMessenger>,
    MessengerEvents<NftControllerMessenger>
  >,
): NftControllerMessenger {
  const controllerMessenger: NftControllerMessenger = new Messenger({
    namespace: 'NftController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    events: [
      'PreferencesController:stateChange',
      'AccountsController:selectedEvmAccountChange',
    ],
    actions: [
      'ApprovalController:addRequest',
      'NetworkController:getNetworkClientById',
      'AccountsController:getSelectedAccount',
      'AccountsController:getAccount',
      'AssetsContractController:getERC721AssetName',
      'AssetsContractController:getERC721AssetSymbol',
      'AssetsContractController:getERC721TokenURI',
      'AssetsContractController:getERC1155TokenURI',
      'NetworkController:findNetworkClientIdByChainId',
      'PhishingController:bulkScanUrls',
    ],
  });
  return controllerMessenger;
}

export type NftControllerInitMessenger = ReturnType<
  typeof getNftControllerInitMessenger
>;

/**
 * Get a restricted messenger for initializing the NFT controller. This is scoped
 * to the actions that are allowed during controller initialization.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getNftControllerInitMessenger(
  messenger: RootMessenger<never, never>,
) {
  const controllerInitMessenger = new Messenger<
    'NftControllerInit',
    never,
    never,
    typeof messenger
  >({
    namespace: 'NftControllerInit',
    parent: messenger,
  });
  return controllerInitMessenger;
}
