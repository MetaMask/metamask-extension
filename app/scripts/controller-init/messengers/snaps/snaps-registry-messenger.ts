import { Messenger } from '@metamask/base-controller';

export type SnapsRegistryMessenger = ReturnType<
  typeof getSnapsRegistryMessenger
>;

/**
 * Get a restricted messenger for the Snaps registry. This is scoped to the
 * actions and events that the Snaps registry is allowed to handle.
 *
 * @param controllerMessenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSnapsRegistryMessenger(
  controllerMessenger: Messenger<never, never>,
) {
  return controllerMessenger.getRestricted({
    name: 'SnapsRegistry',
    allowedEvents: [],
    allowedActions: [],
  });
}
