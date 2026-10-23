import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';
import type { BrazeServiceMessenger } from '../../services/braze-service';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * Braze service.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 * @returns The Braze service messenger.
 */
export function getBrazeServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<BrazeServiceMessenger>,
    MessengerEvents<BrazeServiceMessenger>
  >,
): BrazeServiceMessenger {
  const serviceMessenger: BrazeServiceMessenger = new Messenger({
    namespace: 'BrazeService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: [
      'AuthenticationController:getState',
      'KeyringController:getState',
      'OnboardingController:getState',
      'PreferencesController:getState',
    ],
    events: [
      'AuthenticationController:stateChange',
      'KeyringController:stateChange',
      'OnboardingController:stateChange',
      'PreferencesController:stateChange',
    ],
  });
  return serviceMessenger;
}
