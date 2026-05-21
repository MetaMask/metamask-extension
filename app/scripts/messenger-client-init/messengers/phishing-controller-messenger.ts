import { Messenger } from '@metamask/messenger';
import { AllowedEvents } from '@metamask/phishing-controller';
import type {
  AddressBookControllerGetStateAction,
} from '@metamask/address-book-controller';
import type { TransactionControllerGetStateAction } from '@metamask/transaction-controller';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions =
  | AddressBookControllerGetStateAction
  | TransactionControllerGetStateAction;

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
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const controllerMessenger = new Messenger<
    'PhishingController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'PhishingController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AddressBookController:getState',
      'TransactionController:getState',
    ],
    events: [
      'AddressBookController:stateChange',
      'TransactionController:stateChange',
    ],
  });
  return controllerMessenger;
}
