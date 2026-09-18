import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { SubjectMetadataControllerMessenger } from '@metamask/permission-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * subject metadata controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getSubjectMetadataControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<SubjectMetadataControllerMessenger>,
    MessengerEvents<SubjectMetadataControllerMessenger>
  >,
): SubjectMetadataControllerMessenger {
  const controllerMessenger: SubjectMetadataControllerMessenger = new Messenger(
    {
      namespace: 'SubjectMetadataController',
      parent: messenger,
    },
  );
  messenger.delegate({
    messenger: controllerMessenger,
    actions: ['PermissionController:hasPermissions'],
  });
  return controllerMessenger;
}
