import { Messenger } from '@metamask/messenger';
import type {
  AnalyticsControllerGetStateAction,
  AnalyticsControllerIdentifyAction,
  AnalyticsControllerTrackEventAction,
  AnalyticsControllerTrackViewAction,
} from '@metamask/analytics-controller';
import type { MultichainNetworkControllerGetStateAction } from '@metamask/multichain-network-controller';
import type {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import type { PreferencesControllerGetStateAction } from '../preferences-controller';
import type { MetaMetricsControllerGetStateAction } from '../metametrics-controller';
import type { RootMessenger } from '../../lib/messenger';

type AllowedActions =
  | PreferencesControllerGetStateAction
  | MultichainNetworkControllerGetStateAction
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction
  | RemoteFeatureFlagControllerGetStateAction
  | MetaMetricsControllerGetStateAction
  | AnalyticsControllerGetStateAction
  | AnalyticsControllerTrackEventAction
  | AnalyticsControllerIdentifyAction
  | AnalyticsControllerTrackViewAction;

/**
 * Messenger type for {@link AnalyticsEventBuilder} configuration.
 *
 * Restricted to controller state reads required to normalize analytics events.
 */
export type AnalyticsEventBuilderMessenger = Messenger<
  'AnalyticsEventBuilder',
  AllowedActions,
  never
>;

/**
 * Create a messenger restricted to actions the analytics event builder needs.
 *
 * @param messenger - The root messenger used to create the restricted messenger.
 */
export function getAnalyticsEventBuilderMessenger(
  messenger: RootMessenger,
): AnalyticsEventBuilderMessenger {
  const analyticsEventBuilderMessenger: AnalyticsEventBuilderMessenger =
    new Messenger({
      namespace: 'AnalyticsEventBuilder',
      parent: messenger,
    });

  messenger.delegate({
    messenger: analyticsEventBuilderMessenger,
    actions: [
      'PreferencesController:getState',
      'MultichainNetworkController:getState',
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
      'RemoteFeatureFlagController:getState',
      'MetaMetricsController:getState',
      'AnalyticsController:getState',
      'AnalyticsController:trackEvent',
      'AnalyticsController:identify',
      'AnalyticsController:trackView',
    ],
    events: [],
  });

  return analyticsEventBuilderMessenger;
}
