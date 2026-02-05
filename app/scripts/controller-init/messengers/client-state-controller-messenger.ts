import type {
  ClientStateControllerActions,
  ClientStateControllerEvents,
} from '@metamask/client-state-controller';
import { Messenger } from '@metamask/messenger';

import type { RootMessenger } from '../../lib/messenger';

export type ClientStateControllerMessenger = ReturnType<
  typeof getClientStateControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * ClientStateController.
 *
 * @param messenger - The base messenger used to create the restricted messenger.
 * @returns The restricted messenger.
 */
export function getClientStateControllerMessenger(
  messenger: RootMessenger<
    ClientStateControllerActions,
    ClientStateControllerEvents
  >,
) {
  return new Messenger<
    'ClientStateController',
    ClientStateControllerActions,
    ClientStateControllerEvents,
    typeof messenger
  >({
    namespace: 'ClientStateController',
    parent: messenger,
  });
}
