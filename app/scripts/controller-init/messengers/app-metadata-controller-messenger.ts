import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

export type AppMetadataControllerMessenger = ReturnType<
  typeof getAppMetadataControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * app metadata controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAppMetadataControllerMessenger(messenger: RootMessenger) {
  return new Messenger({
    namespace: 'AppMetadataController',
    parent: messenger,
  });
}
