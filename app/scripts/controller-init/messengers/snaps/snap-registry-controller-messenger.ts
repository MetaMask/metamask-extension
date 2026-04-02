import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { SnapRegistryControllerMessenger } from '@metamask/snaps-controllers';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Get a restricted messenger for the Snaps registry. This is scoped to the
 * actions and events that the Snaps registry is allowed to handle.
 *
 * @param controllerMessenger - The messenger to restrict.
 * @returns The restricted messenger.
 */
export function getSnapRegistryControllerMessenger(
  controllerMessenger: RootMessenger<
    MessengerActions<SnapRegistryControllerMessenger>,
    MessengerEvents<SnapRegistryControllerMessenger>
  >,
) {
  return new Messenger({
    namespace: 'SnapRegistryController',
    parent: controllerMessenger,
  });
}
