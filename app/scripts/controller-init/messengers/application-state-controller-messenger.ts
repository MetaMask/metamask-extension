import type {
  ApplicationStateControllerActions,
  ApplicationStateControllerEvents,
} from '@metamask/application-state-controller';
import { Messenger } from '@metamask/messenger';

import type { RootMessenger } from '../../lib/messenger';

export type ApplicationStateControllerMessenger = ReturnType<
  typeof getApplicationStateControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * ApplicationStateController.
 *
 * @param messenger - The base messenger used to create the restricted messenger.
 * @returns The restricted messenger.
 */
export function getApplicationStateControllerMessenger(
  messenger: RootMessenger<
    ApplicationStateControllerActions,
    ApplicationStateControllerEvents
  >,
) {
  return new Messenger<
    'ApplicationStateController',
    ApplicationStateControllerActions,
    ApplicationStateControllerEvents,
    typeof messenger
  >({
    namespace: 'ApplicationStateController',
    parent: messenger,
  });
}
