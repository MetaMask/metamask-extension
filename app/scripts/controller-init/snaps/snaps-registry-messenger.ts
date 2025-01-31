import { ControllerMessenger } from '@metamask/base-controller';

export type SnapsRegistryMessenger = ReturnType<
  typeof getSnapsRegistryMessenger
>;

export function getSnapsRegistryMessenger(
  controllerMessenger: ControllerMessenger<never, never>,
) {
  return controllerMessenger.getRestricted({
    name: 'SnapsRegistry',
    allowedEvents: [],
    allowedActions: [],
  });
}
