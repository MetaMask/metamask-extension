import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { AccountOrderControllerMessenger } from '../../controllers/account-order';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * account order controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 * @returns The restricted messenger.
 */
export function getAccountOrderControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<AccountOrderControllerMessenger>,
    MessengerEvents<AccountOrderControllerMessenger>
  >,
): AccountOrderControllerMessenger {
  const accountOrderControllerMessenger: AccountOrderControllerMessenger =
    new Messenger({
      namespace: 'AccountOrderController',
      parent: messenger,
    });
  return accountOrderControllerMessenger;
}
