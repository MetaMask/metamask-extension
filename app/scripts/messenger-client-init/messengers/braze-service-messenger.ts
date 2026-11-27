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
      'AnalyticsController:getState',
      'AuthenticationController:getState',
      'ClientController:getState',
      'KeyringController:getState',
      'OnboardingController:getState',
      'PreferencesController:getState',
      'SnapController:clearSnapState',
      'SnapController:getSnap',
      'SnapController:handleRequest',
      'SnapController:stopSnap',
    ],
    events: [
      'AnalyticsController:stateChange',
      'AuthenticationController:stateChange',
      'ClientController:stateChange',
      'KeyringController:stateChange',
      'OnboardingController:stateChange',
      'PreferencesController:stateChange',
      'SnapController:snapInstalled',
      'SnapController:snapUpdated',
    ],
  });
  return serviceMessenger;
}
