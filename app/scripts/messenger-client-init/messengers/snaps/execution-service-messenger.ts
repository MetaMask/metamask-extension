import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { ExecutionServiceMessenger } from '@metamask/snaps-controllers';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the execution service. This is scoped to the
 * actions and events that the execution service is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getExecutionServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<ExecutionServiceMessenger>,
    MessengerEvents<ExecutionServiceMessenger>
  >,
) {
  return new Messenger({
    namespace: 'ExecutionService',
    parent: messenger,
  });
}
