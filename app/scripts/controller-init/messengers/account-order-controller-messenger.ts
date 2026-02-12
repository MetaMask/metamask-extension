import { Messenger } from '@metamask/messenger';
import { AccountOrderControllerMessengerActions } from '../../controllers/account-order';
import { RootMessenger } from '../../lib/messenger';

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
  messenger: RootMessenger<AccountOrderControllerMessengerActions, never>,
) {
  return new Messenger<
    'AccountOrderController',
    never,
    never,
    typeof messenger
  >({
    namespace: 'AccountOrderController',
    parent: messenger,
  });
}
