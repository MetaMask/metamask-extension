import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

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
  messenger: RootMessenger<never, never>,
) {
  return new Messenger<'ErrorReportingService', never, never, typeof messenger>(
    {
      namespace: 'ErrorReportingService',
      parent: messenger,
    },
  );
}
