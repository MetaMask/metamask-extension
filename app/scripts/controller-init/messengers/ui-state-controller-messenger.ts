import type {
  UiStateControllerActions,
  UiStateControllerEvents,
} from '@metamask/ui-state-controller';
import { Messenger } from '@metamask/messenger';

import type { RootMessenger } from '../../lib/messenger';

export type UiStateControllerMessenger = ReturnType<
  typeof getUiStateControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * UiStateController.
 *
 * @param messenger - The base messenger used to create the restricted messenger.
 * @returns The restricted messenger.
 */
export function getUiStateControllerMessenger(
  messenger: RootMessenger<
    UiStateControllerActions,
    UiStateControllerEvents
  >,
) {
  return new Messenger<
    'UiStateController',
    UiStateControllerActions,
    UiStateControllerEvents,
    typeof messenger
  >({
    namespace: 'UiStateController',
    parent: messenger,
  });
}
