import { Messenger } from '@metamask/base-controller';
import { AllowedEvents } from '@metamask/phishing-controller';

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
  messenger: Messenger<never, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'PhishingController',
    allowedActions: [],
    allowedEvents: ['TransactionController:stateChange'],
  });
}
