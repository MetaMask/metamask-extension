import {
  ActionHandler,
  Messenger,
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
} from '@metamask/messenger';
import { type RouteMessenger } from '../../ui/messengers/route-messenger';
import type {
  UIMessengerActions,
  UIMessengerEvents,
} from '../../ui/messengers/ui-messenger';

/**
 * Create a route messenger for testing with the specified action handlers.
 *
 * This creates a real Messenger instance with a fake namespace and registers
 * the provided action handlers on it.
 *
 * @param actionHandlers - A map of action type strings to handler functions.
 * @returns A messenger with the specified action handlers registered.
 * @example
 * ```typescript
 * const addNetwork = jest.fn().mockResolvedValue({ chainId: '0x1' });
 * const messenger = createMockRouteMessenger({
 *   'NetworkController:addNetwork': addNetwork,
 * });
 * ```
 */
export function createMockRouteMessenger<
  Actions extends UIMessengerActions = never,
>(actionHandlers?: {
  [Action in Actions as Action['type']]: Action['handler'];
}): RouteMessenger<Actions['type']> {
  const messenger = new Messenger<
    MockAnyNamespace,
    UIMessengerActions,
    UIMessengerEvents
  >({
    namespace: MOCK_ANY_NAMESPACE,
  });

  for (const [actionType, handler] of Object.entries(actionHandlers ?? {})) {
    messenger.registerActionHandler(
      actionType as Actions['type'],
      handler as ActionHandler<Actions, Actions['type']>,
    );
  }

  return messenger;
}
