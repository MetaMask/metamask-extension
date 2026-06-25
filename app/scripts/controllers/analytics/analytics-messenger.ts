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
 * Messenger type for analytics normalization and delivery.
 */
export type AnalyticsMessenger = Messenger<'Analytics', AllowedActions, never>;

/**
 * Create a messenger restricted to analytics state reads and delivery actions.
 *
 * @param messenger - The root messenger used to create the restricted messenger.
 */
export function getAnalyticsMessenger(
  messenger: RootMessenger,
): AnalyticsMessenger {
  const analyticsMessenger: AnalyticsMessenger = new Messenger({
    namespace: 'Analytics',
    parent: messenger,
  });

  messenger.delegate({
    messenger: analyticsMessenger,
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

  return analyticsMessenger;
}
