import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../../lib/messenger';

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
  controllerMessenger: RootMessenger<never, never>,
) {
  return new Messenger({
    namespace: 'SnapsRegistry',
    parent: controllerMessenger,
  });
}
