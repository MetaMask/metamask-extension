import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';
import { MetaMetricsDataDeletionControllerMessenger } from '../../controllers/metametrics-data-deletion/metametrics-data-deletion';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * MetaMetrics data deletion controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getMetaMetricsDataDeletionControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<MetaMetricsDataDeletionControllerMessenger>,
    MessengerEvents<MetaMetricsDataDeletionControllerMessenger>
  >,
) {
  const metaMetricsDataDeletionControllerMessenger: MetaMetricsDataDeletionControllerMessenger =
    new Messenger({
      namespace: 'MetaMetricsDataDeletionController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: metaMetricsDataDeletionControllerMessenger,
    actions: ['MetaMetricsController:getState'],
  });
  return metaMetricsDataDeletionControllerMessenger;
}
