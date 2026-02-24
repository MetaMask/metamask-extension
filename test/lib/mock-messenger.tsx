//========
// In unit tests for components and hooks we will need a way to make a messenger
// that can be mocked. This file defines a function that lets us do that.
//========

import { ActionHandler, Messenger, MOCK_ANY_NAMESPACE, MockAnyNamespace } from '@metamask/messenger';
import {
  type RouteMessenger,
} from '../../ui/messengers/route-messenger';
import type {
  UIMessengerActions,
  UIMessengerEvents,
} from '../../ui/messengers/ui-messenger';

/**
 * Maps each UIMessenger action type string to its handler function type.
 */
export type UIMessengerActionHandlersByType = {
  [Action in UIMessengerActions as Action['type']]: Action['handler'];
};

/**
 * Creates a messenger for testing with the specified action handlers.
 *
 * This creates a real Messenger instance with the "Route" namespace and
 * registers the provided action handlers on it.
 *
 * @param actionHandlers - A map of action type strings to handler functions.
 * @returns A messenger with the specified action handlers registered.
 * @example
 * ```typescript
 * const addNetwork = jest.fn().mockResolvedValue({ chainId: '0x1' });
 * const messenger = createMockMessenger({
 *   'NetworkController:addNetwork': addNetwork,
 * });
 * ```
 */
export function createMockMessenger<
  ActionTypes extends UIMessengerActions['type'],
>(
  actionHandlers: Pick<UIMessengerActionHandlersByType, ActionTypes>,
): RouteMessenger<
  Extract<UIMessengerActions, { type: ActionTypes }>,
  UIMessengerEvents
> {
  const messenger = new Messenger<
    MockAnyNamespace,
    UIMessengerActions,
    UIMessengerEvents
  >({
    namespace: MOCK_ANY_NAMESPACE,
  });

  for (const [actionType, handler] of Object.entries(actionHandlers)) {
    messenger.registerActionHandler(
      actionType as ActionTypes,
      handler as ActionHandler<UIMessengerActions, ActionTypes>,
    );
  }

  // Since we are the one registering the actions, we can safely narrow the
  // type.
  return messenger as RouteMessenger<
    Extract<UIMessengerActions, { type: ActionTypes }>,
    UIMessengerEvents
  >;
}
