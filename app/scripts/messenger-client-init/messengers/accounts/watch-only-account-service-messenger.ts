import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { WatchOnlyAccountServiceMessenger as ServiceMessenger } from '@metamask/watch-only-account-service';
import { RootMessenger } from '../../../lib/messenger';

type Actions = MessengerActions<ServiceMessenger>;
type Events = MessengerEvents<ServiceMessenger>;

export type WatchOnlyAccountServiceMessenger = ServiceMessenger;

/**
 * Get a restricted messenger for the watch-only account service. This is
 * scoped to the actions and events that this service is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getWatchOnlyAccountServiceMessenger(
  messenger: RootMessenger<Actions, Events>,
): WatchOnlyAccountServiceMessenger {
  const serviceMessenger = new Messenger<
    'WatchOnlyAccountService',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'WatchOnlyAccountService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: [
      'KeyringController:withController',
      'KeyringController:withKeyringV2',
    ],
  });
  return serviceMessenger;
}
