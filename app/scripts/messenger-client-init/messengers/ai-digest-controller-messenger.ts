import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { AiDigestControllerMessenger } from '@metamask/ai-controllers';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger for the AiDigestController, scoped to the actions and
 * events it is allowed to use.
 *
 * @param messenger - The root messenger.
 * @returns The AiDigestController messenger.
 */
export function getAiDigestControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<AiDigestControllerMessenger>,
    MessengerEvents<AiDigestControllerMessenger>
  >,
): AiDigestControllerMessenger {
  const controllerMessenger: AiDigestControllerMessenger = new Messenger({
    namespace: 'AiDigestController',
    parent: messenger,
  });

  messenger.delegate({
    messenger: controllerMessenger,
    actions: [],
    events: [],
  });

  return controllerMessenger;
}
