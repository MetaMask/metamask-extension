import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import type { AnalyticsControllerMessenger } from '@metamask/analytics-controller';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * analytics controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAnalyticsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<AnalyticsControllerMessenger>,
    MessengerEvents<AnalyticsControllerMessenger>
  >,
) {
  const analyticsControllerMessenger: AnalyticsControllerMessenger =
    new Messenger({
      namespace: 'AnalyticsController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: analyticsControllerMessenger,
    actions: [],
    events: [],
  });
  return analyticsControllerMessenger;
}
