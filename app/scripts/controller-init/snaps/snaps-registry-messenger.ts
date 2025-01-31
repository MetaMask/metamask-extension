import { ControllerMessenger } from '@metamask/base-controller';

export type SnapsRegistryMessenger = ReturnType<
  typeof getSnapsRegistryMessenger
>;

/**
 * Get a restricted controller messenger for the Snaps registry. This is scoped
 * to the actions and events that the Snaps registry is allowed to handle.
 *
 * @param controllerMessenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getSnapsRegistryMessenger(
  controllerMessenger: ControllerMessenger<never, never>,
) {
  return controllerMessenger.getRestricted({
    name: 'SnapsRegistry',
    allowedEvents: [],
    allowedActions: [],
  });
}
