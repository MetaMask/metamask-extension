import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import {
  RAMPS_CONTROLLER_REQUIRED_SERVICE_ACTIONS,
  type RampsControllerMessenger,
} from '@metamask/ramps-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Get the messenger for the RampsController. Delegates the RampsService and
 * TransakService actions required by the controller.
 *
 * @param messenger - The root messenger.
 * @returns The RampsControllerMessenger.
 */
export function getRampsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<RampsControllerMessenger>,
    MessengerEvents<RampsControllerMessenger>
  >,
): RampsControllerMessenger {
  const controllerMessenger: RampsControllerMessenger = new Messenger({
    namespace: 'RampsController',
    parent: messenger,
  });

  messenger.delegate({
    messenger: controllerMessenger,
    actions: [...RAMPS_CONTROLLER_REQUIRED_SERVICE_ACTIONS],
    events: [],
  });

  return controllerMessenger;
}
