import { Messenger } from '@metamask/base-controller';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/metametrics-data-deletion/metametrics-data-deletion';

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
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'MetaMetricsDataDeletionController',
    allowedActions: ['MetaMetricsController:getState'],
    allowedEvents: [],
  });
}
