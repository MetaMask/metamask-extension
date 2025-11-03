import { Messenger } from '@metamask/messenger';
import type { HasPermissions } from '@metamask/permission-controller';
import { RootMessenger } from '../../lib/messenger';

type AllowedActions = HasPermissions;

export type SubjectMetadataControllerMessenger = ReturnType<
  typeof getSubjectMetadataControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * subject metadata controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getSubjectMetadataControllerMessenger(
  messenger: RootMessenger<AllowedActions, never>,
) {
  const controllerMessenger = new Messenger<
    'SubjectMetadataController',
    AllowedActions,
    never,
    typeof messenger
  >({
    namespace: 'SubjectMetadataController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: ['PermissionController:hasPermissions'],
  });
  return controllerMessenger;
}
