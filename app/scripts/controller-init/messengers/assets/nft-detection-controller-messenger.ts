import { Messenger } from '@metamask/messenger';
import {
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import { PreferencesControllerStateChangeEvent } from '@metamask/preferences-controller';
import { AddApprovalRequest } from '@metamask/approval-controller';
import { PhishingControllerBulkScanUrlsAction } from '@metamask/phishing-controller';
import { RootMessenger } from '../../../lib/messenger';

type Actions =
  | AddApprovalRequest
  | NetworkControllerGetStateAction
  | AccountsControllerGetSelectedAccountAction
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | PhishingControllerBulkScanUrlsAction;
type Events =
  | PreferencesControllerStateChangeEvent
  | NetworkControllerStateChangeEvent;

export type NftDetectionControllerMessenger = ReturnType<
  typeof getNftDetectionControllerMessenger
>;

/**
 * Get a restricted messenger for the NFT detection controller. This is scoped to the
 * actions and events that the NFT controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getNftDetectionControllerMessenger(
  messenger: RootMessenger<Actions, Events>,
) {
  const controllerMessenger = new Messenger<
    'NftDetectionController',
    Actions,
    Events,
    typeof messenger
  >({
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
      'PhishingController:bulkScanUrls',
    ],
  });
  return controllerMessenger;
}
