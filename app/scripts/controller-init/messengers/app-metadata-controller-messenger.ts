import { Messenger } from '@metamask/base-controller';

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
export function getAppMetadataControllerMessenger(
  messenger: Messenger<never, never>,
) {
  return messenger.getRestricted({
    name: 'AppMetadataController',

    // This controller does not call any actions or subscribe to any events.
    allowedActions: [],
    allowedEvents: [],
  });
}
