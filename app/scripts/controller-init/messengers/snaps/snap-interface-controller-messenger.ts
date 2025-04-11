import type { AccountsControllerGetAccountByAddressAction } from '@metamask/accounts-controller';
import type {
  AcceptRequest,
  HasApprovalRequest,
} from '@metamask/approval-controller';
import type { MultichainAssetsControllerGetStateAction } from '@metamask/assets-controllers';
import type { Messenger } from '@metamask/base-controller';
import type { NotificationListUpdatedEvent } from '@metamask/notification-services-controller/notification-services';
import type {
  MaybeUpdateState,
  TestOrigin,
} from '@metamask/phishing-controller';
import type { GetSnap } from '@metamask/snaps-controllers';

type Actions =
  | MaybeUpdateState
  | TestOrigin
  | HasApprovalRequest
  | AcceptRequest
  | GetSnap
  | AccountsControllerGetAccountByAddressAction
  | MultichainAssetsControllerGetStateAction;

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
      'AccountsController:getAccountByAddress',
      'MultichainAssetsController:getState',
    ],
    allowedEvents: ['NotificationServicesController:notificationsListUpdated'],
  });
}
