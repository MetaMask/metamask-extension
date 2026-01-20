import { Messenger } from '@metamask/messenger';
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
import { HasPermission } from '@metamask/permission-controller';
import { RootMessenger } from '../../../lib/messenger';

type Actions =
  | MaybeUpdateState
  | TestOrigin
  | HasApprovalRequest
  | AcceptRequest
  | GetSnap
  | MultichainAssetsControllerGetStateAction
  | AccountsControllerGetSelectedMultichainAccountAction
  | AccountsControllerGetAccountByAddressAction
  | AccountsControllerListMultichainAccountsAction
  | HasPermission;

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
  messenger: RootMessenger<Actions, Events>,
) {
  const controllerMessenger = new Messenger<
    'SnapInterfaceController',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'SnapInterfaceController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      `PhishingController:maybeUpdateState`,
      `PhishingController:testOrigin`,
      `ApprovalController:hasRequest`,
      `ApprovalController:acceptRequest`,
      `SnapController:get`,
      'MultichainAssetsController:getState',
      `AccountsController:getSelectedMultichainAccount`,
      `AccountsController:getAccountByAddress`,
      `AccountsController:listMultichainAccounts`,
      `PermissionController:hasPermission`,
    ],
    events: ['NotificationServicesController:notificationsListUpdated'],
  });
  return controllerMessenger;
}
