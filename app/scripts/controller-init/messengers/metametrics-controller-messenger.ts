import { Messenger } from '@metamask/messenger';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/metametrics-controller';
import { RootMessenger } from '../../lib/messenger';

export type MetaMetricsControllerMessenger = ReturnType<
  typeof getMetaMetricsControllerMessenger
>;

export function getMetaMetricsControllerMessenger(messenger: RootMessenger) {
  const metaMetricsControllerMessenger = new Messenger<
    'MetaMetricsController',
    AllowedActions,
    AllowedEvents,
    RootMessenger
  >({
    namespace: 'MetaMetricsController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: metaMetricsControllerMessenger,
    actions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'PreferencesController:getState',
    ],
    events: [
      'PreferencesController:stateChange',
      'NetworkController:networkDidChange',
    ],
  });
  return metaMetricsControllerMessenger;
}
