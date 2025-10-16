import { Messenger } from '@metamask/base-controller';

export type RatesControllerMessenger = ReturnType<
  typeof getRatesControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * rates controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getRatesControllerMessenger(
  messenger: Messenger<never, never>,
) {
  return messenger.getRestricted({
    name: 'RatesController',

    // This controller does not call any actions or subscribe to any events.
    allowedActions: [],
    allowedEvents: [],
  });
}
