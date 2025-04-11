import type { AccountsControllerGetSelectedAccountAction } from '@metamask/accounts-controller';
import type { AddApprovalRequest } from '@metamask/approval-controller';
import type { Messenger } from '@metamask/base-controller';
import type {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import type { PreferencesControllerStateChangeEvent } from '@metamask/preferences-controller';

type Actions =
  | AddApprovalRequest
  | NetworkControllerGetStateAction
  | AccountsControllerGetSelectedAccountAction
  | NetworkControllerGetNetworkClientByIdAction;

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
  messenger: Messenger<Actions, Events>,
) {
  return messenger.getRestricted({
    name: 'NftDetectionController',
    allowedEvents: [
      'NetworkController:stateChange',
      'PreferencesController:stateChange',
    ],
    allowedActions: [
      'ApprovalController:addRequest',
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
      'AccountsController:getSelectedAccount',
    ],
  });
}
