import { Messenger } from '@metamask/base-controller';
import { PetNamesControllerMessenger as SamplePetnamesControllerMessenger } from '@metamask/sample-controllers';

// No actions needed for now as per the sample-controllers implementation
type MessengerActions = never;

// No events needed for now as per the sample-controllers implementation
type MessengerEvents = never;

export function getSamplePetnamesControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
): SamplePetnamesControllerMessenger {
  return messenger.getRestricted({
    name: 'SamplePetnamesController',
    allowedActions: [],
    allowedEvents: [],
  });
}

export function getSamplePetnamesControllerInitMessenger(): null {
  return null;
}
