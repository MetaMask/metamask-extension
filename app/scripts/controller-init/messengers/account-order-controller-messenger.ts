import { Messenger } from '@metamask/base-controller';
import { AccountOrderControllerMessengerActions } from '../../controllers/account-order';

export type AccountOrderControllerMessenger = ReturnType<
  typeof getAccountOrderControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * account order controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAccountOrderControllerMessenger(
  messenger: Messenger<AccountOrderControllerMessengerActions, never>,
) {
  return messenger.getRestricted({
    name: 'AccountOrderController',

    // This controller does not call any actions or subscribe to any events.
    allowedActions: [],
    allowedEvents: [],
  });
}
