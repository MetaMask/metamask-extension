import { Messenger } from '@metamask/messenger';
import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerGetAccountAction,
  AccountsControllerSelectedEvmAccountChangeEvent,
} from '@metamask/accounts-controller';
import { PreferencesControllerStateChangeEvent } from '@metamask/preferences-controller';
import {
  AssetsContractControllerGetERC1155TokenURIAction,
  AssetsContractControllerGetERC721AssetNameAction,
  AssetsContractControllerGetERC721AssetSymbolAction,
  AssetsContractControllerGetERC721TokenURIAction,
} from '@metamask/assets-controllers';
import { ApprovalControllerAddRequestAction } from '@metamask/approval-controller';
import { PhishingControllerBulkScanUrlsAction } from '@metamask/phishing-controller';
import { MetaMetricsControllerTrackEventAction } from '../../../controllers/metametrics-controller-method-action-types';
import { RootMessenger } from '../../../lib/messenger';

type Actions =
  | ApprovalControllerAddRequestAction
  | AccountsControllerGetAccountAction
  | AccountsControllerGetSelectedAccountAction
  | NetworkControllerGetNetworkClientByIdAction
  | AssetsContractControllerGetERC721AssetNameAction
  | AssetsContractControllerGetERC721AssetSymbolAction
  | AssetsContractControllerGetERC721TokenURIAction
  | AssetsContractControllerGetERC1155TokenURIAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | PhishingControllerBulkScanUrlsAction;

type Events =
  | PreferencesControllerStateChangeEvent
  | AccountsControllerSelectedEvmAccountChangeEvent;

export type NftControllerMessenger = ReturnType<
  typeof getNftControllerMessenger
>;

/**
 * Get a restricted messenger for the NFT controller. This is scoped to the
 * actions and events that the NFT controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getNftControllerMessenger(
  messenger: RootMessenger<Actions, Events>,
) {
  const controllerMessenger = new Messenger<
    'NftController',
    Actions,
    Events,
    typeof messenger
  >({
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

export type AllowedInitializationActions =
  MetaMetricsControllerTrackEventAction;

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
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'NftControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'NftControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['MetaMetricsController:trackEvent'],
  });
  return controllerInitMessenger;
}
