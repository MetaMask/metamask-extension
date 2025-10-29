import { Messenger } from '@metamask/messenger';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/metametrics-data-deletion/metametrics-data-deletion';
import { RootMessenger } from '../../lib/messenger';

export type MetaMetricsDataDeletionControllerMessenger = ReturnType<
  typeof getMetaMetricsDataDeletionControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * MetaMetrics data deletion controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getMetaMetricsDataDeletionControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const metaMetricsDataDeletionControllerMessenger = new Messenger<
    'MetaMetricsDataDeletionController',
    AllowedActions,
    AllowedEvents,
    RootMessenger<AllowedActions, AllowedEvents>
  >({
    namespace: 'MetaMetricsDataDeletionController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: metaMetricsDataDeletionControllerMessenger,
    actions: ['MetaMetricsController:getState'],
  });
  return metaMetricsDataDeletionControllerMessenger;
}
