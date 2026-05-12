import {
  ActionHandler,
  Messenger,
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
} from '@metamask/messenger';
import type {
  UIMessenger,
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
 * Create a UI messenger for testing with the specified action handlers.
 *
 * This creates a real Messenger instance with a fake namespace and registers
 * the provided action handlers on it.
 *
 * @param actionHandlers - A map of action type strings to handler functions.
 * @returns A messenger with the specified action handlers registered.
 * @example
 * ```typescript
 * const addNetwork = jest.fn().mockResolvedValue({ chainId: '0x1' });
 * const messenger = createMockUIMessenger({
 *   'NetworkController:addNetwork': addNetwork,
 * });
 * ```
 */
export function createMockUIMessenger<
  Actions extends UIMessengerActions = never,
>(actionHandlers?: {
  [Action in Actions as Action['type']]: Action['handler'];
}): UIMessenger {
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

  // UIMessenger is a subclass of Messenger that includes private fields.
  // We don't want to create a real UIMessenger instance above, we want to make
  // a "fake" one, but we want TypeScript to think this is a real one.
  return messenger as UIMessenger;
}
