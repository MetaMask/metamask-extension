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
      'AnalyticsController:getState',
      'AnalyticsController:identify',
      'AnalyticsController:optIn',
      'AnalyticsController:optOut',
      'AnalyticsController:trackEvent',
      'AnalyticsController:trackView',
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'PreferencesController:getState',
      'RemoteFeatureFlagController:getState',
      'MultichainNetworkController:getState',
      'SeedlessOnboardingController:getState',
    ],
    events: [
      'PreferencesController:stateChange',
      'NetworkController:networkDidChange',
    ],
  });
  return metaMetricsControllerMessenger;
}
