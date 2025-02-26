import { ActionConstraint, Messenger } from '@metamask/base-controller';
import { PetNamesControllerMessenger as SamplePetnamesControllerMessenger } from '../../controllers/sample';

type MessengerActions = ActionConstraint;

// No events needed for now as per the sample-controllers implementation
type MessengerEvents = never;

export function getSamplePetnamesControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
): SamplePetnamesControllerMessenger {
  return messenger.getRestricted({
    name: 'PetNamesController',
    allowedActions: ['NetworkController:getState'],
    allowedEvents: [],
  });
}
