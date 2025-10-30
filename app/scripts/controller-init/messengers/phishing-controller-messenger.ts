import { Messenger } from '@metamask/messenger';
import { AllowedEvents } from '@metamask/phishing-controller';
import { RootMessenger } from '../../lib/messenger';

export type PhishingControllerMessenger = ReturnType<
  typeof getPhishingControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * phishing controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getPhishingControllerMessenger(
  messenger: RootMessenger<never, AllowedEvents>,
) {
  const controllerMessenger = new Messenger<
    'PhishingController',
    never,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'PhishingController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    events: ['TransactionController:stateChange'],
  });
  return controllerMessenger;
}
