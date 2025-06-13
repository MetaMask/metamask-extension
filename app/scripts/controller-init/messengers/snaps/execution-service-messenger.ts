import { Messenger } from '@metamask/base-controller';

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
  messenger: Messenger<never, never>,
) {
  return messenger.getRestricted({
    name: 'ExecutionService',
    allowedEvents: [],
    allowedActions: [],
  });
}
