import { Messenger } from '@metamask/base-controller';
import { GasPricesControllerMessenger as SampleGasPricesControllerMessenger } from '@metamask/sample-controllers';

// No actions needed for now as per the sample-controllers implementation
type MessengerActions = never;

// No events needed for now as per the sample-controllers implementation
type MessengerEvents = never;

export function getSampleGasPricesControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
): SampleGasPricesControllerMessenger {
  return messenger.getRestricted({
    name: 'SampleGasPricesController',
    allowedActions: [],
    allowedEvents: [],
  });
}

export function getSampleGasPricesControllerInitMessenger(): null {
  return null;
}
