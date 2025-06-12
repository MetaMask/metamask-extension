import { Messenger } from '@metamask/base-controller';
import {
  AccountsControllerListMultichainAccountsAction,
  GetSnap,
} from '@metamask/snaps-controllers';
import {
  AcceptRequest,
  HasApprovalRequest,
} from '@metamask/approval-controller';
import { MaybeUpdateState, TestOrigin } from '@metamask/phishing-controller';
import { NotificationListUpdatedEvent } from '@metamask/notification-services-controller/notification-services';
import { MultichainAssetsControllerGetStateAction } from '@metamask/assets-controllers';
import {
  AccountsControllerGetAccountByAddressAction,
  AccountsControllerGetSelectedMultichainAccountAction,
} from '@metamask/accounts-controller';

type Actions =
  | MaybeUpdateState
  | TestOrigin
  | HasApprovalRequest
  | AcceptRequest
  | GetSnap
  | MultichainAssetsControllerGetStateAction
  | AccountsControllerGetSelectedMultichainAccountAction
  | AccountsControllerGetAccountByAddressAction
  | AccountsControllerListMultichainAccountsAction;

type Events = NotificationListUpdatedEvent;

export type SnapInterfaceControllerMessenger = ReturnType<
  typeof getSnapInterfaceControllerMessenger
>;

/**
 * Get a restricted messenger for the Snap interface controller. This is scoped
 * to the actions and events that the Snap interface controller is allowed to
 * handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSnapInterfaceControllerMessenger(
  messenger: Messenger<Actions, Events>,
) {
  return messenger.getRestricted({
    name: 'SnapInterfaceController',
    allowedActions: [
      `PhishingController:maybeUpdateState`,
      `PhishingController:testOrigin`,
      `ApprovalController:hasRequest`,
      `ApprovalController:acceptRequest`,
      `SnapController:get`,
      'MultichainAssetsController:getState',
      `AccountsController:getSelectedMultichainAccount`,
      `AccountsController:getAccountByAddress`,
      `AccountsController:listMultichainAccounts`,
    ],
    allowedEvents: ['NotificationServicesController:notificationsListUpdated'],
  });
}
