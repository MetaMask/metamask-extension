import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

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
  messenger: RootMessenger<never, never>,
) {
  return new Messenger<'LoggingController', never, never, typeof messenger>({
    namespace: 'LoggingController',
    parent: messenger,
  });
}
