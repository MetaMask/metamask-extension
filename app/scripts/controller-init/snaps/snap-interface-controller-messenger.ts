import { ControllerMessenger } from '@metamask/base-controller';
import { GetSnap } from '@metamask/snaps-controllers';
import {
  AcceptRequest,
  HasApprovalRequest,
} from '@metamask/approval-controller';
import { MaybeUpdateState, TestOrigin } from '@metamask/phishing-controller';
import { NotificationListUpdatedEvent } from '@metamask/notification-services-controller/notification-services';

type Actions =
  | MaybeUpdateState
  | TestOrigin
  | HasApprovalRequest
  | AcceptRequest
  | GetSnap;

type Events = NotificationListUpdatedEvent;

export type SnapInterfaceControllerMessenger = ReturnType<
  typeof getSnapInterfaceControllerMessenger
>;

/**
 * Get a restricted controller messenger for the Snap interface controller. This
 * is scoped to the actions and events that the Snap interface controller is
 * allowed to handle.
 *
 * @param controllerMessenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getSnapInterfaceControllerMessenger(
  controllerMessenger: ControllerMessenger<Actions, Events>,
) {
  return controllerMessenger.getRestricted({
    name: 'SnapInterfaceController',
    allowedActions: [
      `PhishingController:maybeUpdateState`,
      `PhishingController:testOrigin`,
      `ApprovalController:hasRequest`,
      `ApprovalController:acceptRequest`,
      `SnapController:get`,
    ],
    allowedEvents: ['NotificationServicesController:notificationsListUpdated'],
  });
}
