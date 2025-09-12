import { Messenger } from '@metamask/base-controller';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/metametrics-controller';

export type MetaMetricsControllerMessenger = ReturnType<
  typeof getMetaMetricsControllerMessenger
>;

export function getMetaMetricsControllerMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'MetaMetricsController',
    allowedActions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'PreferencesController:getState',
    ],
    allowedEvents: [
      'PreferencesController:stateChange',
      'NetworkController:networkDidChange',
    ],
  });
}
