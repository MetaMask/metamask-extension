import { Messenger } from '@metamask/base-controller';

export type ErrorReportingServiceMessenger = ReturnType<
  typeof getErrorReportingServiceMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * error reporting service.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getErrorReportingServiceMessenger(
  messenger: Messenger<never, never>,
) {
  return messenger.getRestricted({
    name: 'ErrorReportingService',

    // This service does not call any actions or subscribe to any events.
    allowedActions: [],
    allowedEvents: [],
  });
}
