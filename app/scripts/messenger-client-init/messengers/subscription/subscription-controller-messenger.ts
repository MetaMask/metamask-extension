import { AuthenticationController } from '@metamask/profile-sync-controller';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { SubscriptionControllerMessenger } from '@metamask/subscription-controller';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the Subscription controller. This is scoped to the
 * actions and events that the Subscription controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getSubscriptionControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<SubscriptionControllerMessenger>,
    MessengerEvents<SubscriptionControllerMessenger>
  >,
) {
  const controllerMessenger: SubscriptionControllerMessenger = new Messenger({
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
  AuthenticationController.AuthenticationControllerGetBearerTokenAction;

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
