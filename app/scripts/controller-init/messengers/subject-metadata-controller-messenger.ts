import { Messenger } from '@metamask/base-controller';
import type { HasPermissions } from '@metamask/permission-controller';

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
  messenger: Messenger<AllowedActions, never>,
) {
  return messenger.getRestricted({
    name: 'SubjectMetadataController',
    allowedActions: ['PermissionController:hasPermissions'],
    allowedEvents: [],
  });
}
