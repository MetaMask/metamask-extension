import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { MetaMetricsControllerMessenger } from '../../controllers/metametrics-controller';
import { RootMessenger } from '../../lib/messenger';

export function getMetaMetricsControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<MetaMetricsControllerMessenger>,
    MessengerEvents<MetaMetricsControllerMessenger>
  >,
) {
  const metaMetricsControllerMessenger: MetaMetricsControllerMessenger =
    new Messenger({
      namespace: 'MetaMetricsController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: metaMetricsControllerMessenger,
    actions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'PreferencesController:getState',
      'RemoteFeatureFlagController:getState',
    ],
    events: [
      'PreferencesController:stateChange',
      'NetworkController:networkDidChange',
    ],
  });
  return metaMetricsControllerMessenger;
}
