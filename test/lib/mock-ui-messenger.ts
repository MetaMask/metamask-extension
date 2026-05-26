import type {
  ActionConstraint,
  ActionHandler,
  EventConstraint,
  Messenger,
} from '@metamask/messenger';
import type {
  UIMessenger,
  UIMessengerActions,
  UIMessengerEvents,
} from '../../ui/messengers/ui-messenger';

type DelegateeMessenger = Messenger<string, ActionConstraint, EventConstraint>;

type DelegateArgs<
  Actions extends UIMessengerActions,
  Events extends UIMessengerEvents,
> = {
  actions?: Actions['type'][];
  events?: Events['type'][];
  messenger: DelegateeMessenger;
};

/**
 * Create a UI messenger for testing with the specified action handlers.
 *
 * This creates a mock UIMessenger that registers the provided action handlers
 * directly on any messenger delegated to it, bypassing the background
 * connection. Events are not subscribed to since there is no background
 * connection in tests.
 *
 * @param actionHandlers - A map of action type strings to handler functions.
 * @returns A mock UI messenger with the specified action handlers.
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
  Events extends UIMessengerEvents = never,
>(actionHandlers?: {
  [Action in Actions as Action['type']]: Action['handler'];
}): UIMessenger {
  return {
    async delegate({ actions = [], messenger }: DelegateArgs<Actions, Events>) {
      for (const actionType of actions) {
        const handler =
          actionHandlers?.[actionType] ??
          (() => {
            throw new Error(
              `No handler registered for action "${String(actionType)}".`,
            );
          });

        messenger._internalRegisterDelegatedActionHandler(actionType, handler);
      }

      // No background connection in tests — events are not subscribed to.
    },

    async revoke({ actions = [], messenger }: DelegateArgs<Actions, Events>) {
      for (const actionType of actions) {
        messenger._internalUnregisterDelegatedActionHandler(actionType);
      }
    },
  } as unknown as UIMessenger;
}
