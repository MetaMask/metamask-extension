import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';
import { DataDeletionServiceMessenger } from '../../services/data-deletion-service';

/**
 * Create a messenger restricted to the allowed actions and events of the Data Deletion Service.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getDataDeletionServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<DataDeletionServiceMessenger>,
    MessengerEvents<DataDeletionServiceMessenger>
  >,
) {
  const controllerMessenger: DataDeletionServiceMessenger = new Messenger({
    namespace: 'DataDeletionService',
    parent: messenger,
  });

  return controllerMessenger;
}
