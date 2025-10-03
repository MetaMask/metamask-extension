import { AuthenticationController } from '@metamask/profile-sync-controller';
import { Messenger } from '@metamask/base-controller';

type Actions =
  | AuthenticationController.AuthenticationControllerGetBearerToken
  | AuthenticationController.AuthenticationControllerPerformSignOut;

type Events = AuthenticationController.AuthenticationControllerStateChangeEvent;

export type SubscriptionControllerMessenger = ReturnType<
  typeof getSubscriptionControllerMessenger
>;

/**
 * Get a restricted messenger for the Subscription controller. This is scoped to the
 * actions and events that the Subscription controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getSubscriptionControllerMessenger(
  messenger: Messenger<Actions, Events>,
) {
  return messenger.getRestricted({
    name: 'SubscriptionController',
    allowedEvents: ['AuthenticationController:stateChange'],
    allowedActions: [
      'AuthenticationController:getBearerToken',
      'AuthenticationController:performSignOut',
    ],
  });
}

type InitActions =
  AuthenticationController.AuthenticationControllerGetBearerToken;

type InitEvents = never;

export type SubscriptionControllerInitMessenger = ReturnType<
  typeof getSubscriptionControllerInitMessenger
>;

export function getSubscriptionControllerInitMessenger(
  messenger: Messenger<InitActions, InitEvents>,
) {
  return messenger.getRestricted({
    name: 'SubscriptionControllerInit',
    allowedEvents: [],
    allowedActions: ['AuthenticationController:getBearerToken'],
  });
}
