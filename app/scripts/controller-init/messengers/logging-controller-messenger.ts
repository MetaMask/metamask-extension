import { Messenger } from '@metamask/base-controller';

export type LoggingControllerMessenger = ReturnType<
  typeof getLoggingControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * logging controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getLoggingControllerMessenger(
  messenger: Messenger<never, never>,
) {
  return messenger.getRestricted({
    name: 'LoggingController',

    // This controller does not call any actions or subscribe to any events.
    allowedActions: [],
    allowedEvents: [],
  });
}
