import { AuthenticationController } from '@metamask/profile-sync-controller';
import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../../lib/messenger';

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
  messenger: RootMessenger<Actions, Events>,
) {
  const controllerMessenger = new Messenger<
    'SubscriptionController',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'SubscriptionController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    events: ['AuthenticationController:stateChange'],
    actions: [
      'AuthenticationController:getBearerToken',
      'AuthenticationController:performSignOut',
    ],
  });
  return controllerMessenger;
}

type InitActions =
  AuthenticationController.AuthenticationControllerGetBearerToken;

type InitEvents = never;

export type SubscriptionControllerInitMessenger = ReturnType<
  typeof getSubscriptionControllerInitMessenger
>;

export function getSubscriptionControllerInitMessenger(
  messenger: RootMessenger<InitActions, InitEvents>,
) {
  const controllerInitMessenger = new Messenger<
    'SubscriptionControllerInit',
    InitActions,
    InitEvents,
    typeof messenger
  >({
    namespace: 'SubscriptionControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['AuthenticationController:getBearerToken'],
  });
  return controllerInitMessenger;
}
