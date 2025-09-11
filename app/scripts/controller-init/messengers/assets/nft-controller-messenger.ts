import { Messenger } from '@metamask/base-controller';
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
  AssetsContractControllerGetERC1155BalanceOfAction,
  AssetsContractControllerGetERC1155TokenURIAction,
  AssetsContractControllerGetERC721AssetNameAction,
  AssetsContractControllerGetERC721AssetSymbolAction,
  AssetsContractControllerGetERC721OwnerOfAction,
  AssetsContractControllerGetERC721TokenURIAction,
} from '@metamask/assets-controllers';
import { AddApprovalRequest } from '@metamask/approval-controller';
import { PhishingControllerBulkScanUrlsAction } from '@metamask/phishing-controller';
import { MetaMetricsControllerTrackEventAction } from '../../../controllers/metametrics-controller';

type Actions =
  | AddApprovalRequest
  | AccountsControllerGetAccountAction
  | AccountsControllerGetSelectedAccountAction
  | NetworkControllerGetNetworkClientByIdAction
  | AssetsContractControllerGetERC721AssetNameAction
  | AssetsContractControllerGetERC721AssetSymbolAction
  | AssetsContractControllerGetERC721TokenURIAction
  | AssetsContractControllerGetERC721OwnerOfAction
  | AssetsContractControllerGetERC1155BalanceOfAction
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
  messenger: Messenger<Actions, Events>,
) {
  return messenger.getRestricted({
    name: 'NftController',
    allowedEvents: [
      'PreferencesController:stateChange',
      'AccountsController:selectedEvmAccountChange',
    ],
    allowedActions: [
      'ApprovalController:addRequest',
      'NetworkController:getNetworkClientById',
      'AccountsController:getSelectedAccount',
      'AccountsController:getAccount',
      'AssetsContractController:getERC721AssetName',
      'AssetsContractController:getERC721AssetSymbol',
      'AssetsContractController:getERC721TokenURI',
      'AssetsContractController:getERC721OwnerOf',
      'AssetsContractController:getERC1155BalanceOf',
      'AssetsContractController:getERC1155TokenURI',
      'NetworkController:findNetworkClientIdByChainId',
      'PhishingController:bulkScanUrls',
    ],
  });
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
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'NftControllerInit',
    allowedActions: ['MetaMetricsController:trackEvent'],
    allowedEvents: [],
  });
}
