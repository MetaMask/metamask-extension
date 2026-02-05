import type {
  ClientControllerActions,
  ClientControllerEvents,
} from '@metamask/client-controller';
import { Messenger } from '@metamask/messenger';

import type { RootMessenger } from '../../lib/messenger';

export type ClientControllerMessenger = ReturnType<
  typeof getClientControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * ClientController.
 *
 * @param messenger - The base messenger used to create the restricted messenger.
 * @returns The restricted messenger.
 */
export function getClientControllerMessenger(
  messenger: RootMessenger<
    ClientControllerActions,
    ClientControllerEvents
  >,
) {
  return new Messenger<
    'ClientController',
    ClientControllerActions,
    ClientControllerEvents,
    typeof messenger
  >({
    namespace: 'ClientController',
    parent: messenger,
  });
}
