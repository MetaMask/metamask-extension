import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';
import { AppMetadataControllerMessenger } from '../../controllers/app-metadata';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * app metadata controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAppMetadataControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<AppMetadataControllerMessenger>,
    MessengerEvents<AppMetadataControllerMessenger>
  >,
) {
  const appMetadataMessenger: AppMetadataControllerMessenger = new Messenger({
    namespace: 'AppMetadataController',
    parent: messenger,
  });

  return appMetadataMessenger;
}
