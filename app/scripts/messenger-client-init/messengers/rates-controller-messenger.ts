import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { RatesControllerMessenger } from '@metamask/assets-controllers';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * rates controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getRatesControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<RatesControllerMessenger>,
    MessengerEvents<RatesControllerMessenger>
  >,
): RatesControllerMessenger {
  const controllerMessenger: RatesControllerMessenger = new Messenger({
    namespace: 'RatesController',
    parent: messenger,
  });
  return controllerMessenger;
}
