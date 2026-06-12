import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { LoggingControllerMessenger } from '@metamask/logging-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * logging controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getLoggingControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<LoggingControllerMessenger>,
    MessengerEvents<LoggingControllerMessenger>
  >,
): LoggingControllerMessenger {
  const controllerMessenger: LoggingControllerMessenger = new Messenger({
    namespace: 'LoggingController',
    parent: messenger,
  });
  return controllerMessenger;
}
