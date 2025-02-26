import { ActionConstraint, Messenger } from '@metamask/base-controller';
import { SampleGasPricesControllerMessenger } from '../../controllers/sample';

type MessengerActions = ActionConstraint;
type MessengerEvents = never;

export function getSampleGasPricesControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
): SampleGasPricesControllerMessenger {
  return messenger.getRestricted({
    name: 'SampleGasPricesController',
    allowedActions: ['NetworkController:getState'],
    allowedEvents: [],
  });
}
