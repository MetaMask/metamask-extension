import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { ShieldControllerMessenger } from '@metamask/shield-controller';

type MessengerActions =
  ShieldControllerMessenger extends RestrictedMessenger<
    never,
    infer Actions,
    never,
    never,
    never
  >
    ? Actions
    : never;
type MessengerEvents =
  ShieldControllerMessenger extends RestrictedMessenger<
    never,
    never,
    infer Events,
    never,
    never
  >
    ? Events
    : never;

/**
 * Get a restricted messenger for the Shield controller. This is scoped to the
 * actions and events that the Shield controller is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getShieldControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
) {
  return messenger.getRestricted({
    name: 'ShieldController',
    allowedActions: ['SubscriptionController:checkSubscriptionStatus'],
    allowedEvents: ['TransactionController:unapprovedTransactionAdded'],
  });
}
