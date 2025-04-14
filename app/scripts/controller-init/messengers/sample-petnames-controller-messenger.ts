import { ActionConstraint, Messenger } from '@metamask/base-controller';
import { SamplePetnamesControllerMessenger } from '@metamask/sample-controllers';

type MessengerActions = ActionConstraint;

// No events needed for now as per the sample-controllers implementation
type MessengerEvents = never;

export function getSamplePetnamesControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
): SamplePetnamesControllerMessenger {
  return messenger.getRestricted({
    name: 'SamplePetnamesController',
    allowedActions: ['NetworkController:getState'],
    allowedEvents: [],
  });
}
