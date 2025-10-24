import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../../lib/messenger';

export type ExecutionServiceMessenger = ReturnType<
  typeof getExecutionServiceMessenger
>;

/**
 * Get a restricted messenger for the execution service. This is scoped to the
 * actions and events that the execution service is allowed to handle.
 *
 * @param messenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getExecutionServiceMessenger(
  messenger: RootMessenger<never, never>,
) {
  return new Messenger<'ExecutionService', never, never, typeof messenger>({
    namespace: 'ExecutionService',
    parent: messenger,
  });
}
