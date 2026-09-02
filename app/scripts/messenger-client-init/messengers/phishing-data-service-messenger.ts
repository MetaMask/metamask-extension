import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { PhishingDataServiceMessenger } from '@metamask/phishing-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * phishing data service. The StorageService actions are required for
 * persisting the service's query cache between sessions.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 * @returns The service messenger.
 */
export function getPhishingDataServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<PhishingDataServiceMessenger>,
    MessengerEvents<PhishingDataServiceMessenger>
  >,
): PhishingDataServiceMessenger {
  const serviceMessenger: PhishingDataServiceMessenger = new Messenger({
    namespace: 'PhishingDataService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    actions: [
      'StorageService:getItem',
      'StorageService:setItem',
      'StorageService:removeItem',
    ],
  });
  return serviceMessenger;
}
