import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { PhishingControllerMessenger } from '@metamask/phishing-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * phishing controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getPhishingControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<PhishingControllerMessenger>,
    MessengerEvents<PhishingControllerMessenger>
  >,
): PhishingControllerMessenger {
  const controllerMessenger: PhishingControllerMessenger = new Messenger({
    namespace: 'PhishingController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AddressBookController:getState',
      'TransactionController:getState',
      'PhishingDataService:getStalelist',
      'PhishingDataService:getHotlistDiffs',
      'PhishingDataService:getC2DomainBlocklist',
      'PhishingDataService:scanUrl',
      'PhishingDataService:bulkScanUrls',
      'PhishingDataService:bulkScanTokens',
      'PhishingDataService:scanAddress',
      'PhishingDataService:getApprovals',
    ],
    events: [
      'AddressBookController:stateChange',
      'TransactionController:stateChange',
    ],
  });
  return controllerMessenger;
}
