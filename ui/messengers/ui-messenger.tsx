import {
  Messenger,
  type ActionConstraint,
  type ExtractActionParameters,
  type ExtractActionResponse,
  type ExtractEventPayload,
} from '@metamask/messenger';

import type {
  RootMessengerActions,
  RootMessengerEvents,
  // We are only using the type here (though this should probably be in
  // shared/).
  // eslint-disable-next-line import-x/no-restricted-paths
} from '../../app/scripts/lib/messenger';
import {
  submitRequestToBackground,
  subscribeToMessengerEvent,
} from '../store/background-connection';
import { MESSENGERS_WITH_EXCLUSIONS } from './configs';

/**
 * All actions we call through the UI messenger will go through the background
 * connection and will therefore be asynchronous, even if they weren't
 * originally. This type makes a function asynchronous.
 */
type MakeAsynchronous<InputFunction extends (...args: never[]) => unknown> =
  InputFunction extends (...args: infer Args) => infer Return
    ? (...args: Args) => Promise<Awaited<Return>>
    : never;

/**
 * All actions we call through the UI messenger will go through the background
 * connection and will therefore be asynchronous, even if they weren't
 * originally. This type makes the given actions asynchronous.
 */
// Use a conditional type to ensure that TypeScript distributes a given union
// and we get a union back (this is essentially a `map`)
type MakeActionsAsynchronous<Action> = Action extends ActionConstraint
  ? { type: Action['type']; handler: MakeAsynchronous<Action['handler']> }
  : never;

const EXCLUDED_ACTIONS = MESSENGERS_WITH_EXCLUSIONS.flatMap(
  (config) => config.EXCLUDED_CAPABILITIES.actions,
);

type MessengerWithExclusions = (typeof MESSENGERS_WITH_EXCLUSIONS)[number];
type ExcludedActionTypes =
  MessengerWithExclusions['EXCLUDED_CAPABILITIES']['actions'][number];
type ExcludedEventTypes =
  MessengerWithExclusions['EXCLUDED_CAPABILITIES']['events'][number];

export type UIMessengerActions = MakeActionsAsynchronous<
  Exclude<RootMessengerActions, { type: ExcludedActionTypes }>
>;

export type UIMessengerEvents = Exclude<
  RootMessengerEvents,
  { type: ExcludedEventTypes }
>;

const UI_MESSENGER_NAMESPACE = 'UI';

export class UIMessenger extends Messenger<
  typeof UI_MESSENGER_NAMESPACE,
  UIMessengerActions,
  UIMessengerEvents
> {
  constructor() {
    super({ namespace: UI_MESSENGER_NAMESPACE });
  }

  /**
   * Call an action on the background.
   *
   * This function will call the action handler corresponding to the given
   * action type, passing along any parameters given.
   *
   * @param actionType - The action type. This is a unique identifier for this
   * action.
   * @param params - The action parameters. These must match the type of the
   * parameters of the registered action handler.
   * @throws Will throw when no handler has been registered for the given type.
   * @template ActionType - A type union of Action type strings.
   * @returns The action return value.
   */
  async call<ActionType extends UIMessengerActions['type']>(
    actionType: ActionType,
    ...params: ExtractActionParameters<UIMessengerActions, ActionType>
  ): Promise<Awaited<ExtractActionResponse<UIMessengerActions, ActionType>>> {
    const anyActionType: string = actionType;

    if (EXCLUDED_ACTIONS.includes(anyActionType)) {
      throw new Error(`Action "${actionType}" has not been exposed to the UI.`);
    }

    const result = await submitRequestToBackground('messengerCall', [
      actionType,
      params,
    ]);

    // Type assertion: The type that MetaRPCClient associates with this value
    // doesn't match the return type we've declared above due to some subtle
    // differences in the types, but that's okay. There are some assumptions we
    // have to make anyway.
    return result as Awaited<
      ExtractActionResponse<UIMessengerActions, ActionType>
    >;
  }

  /**
   * Subscribe to an event emitted by the background.
   *
   * Registers the given function as an event handler for the given event type.
   *
   * @param eventType - The event type. This is a unique identifier for this
   * event.
   * @param handler - The event handler. The type of the parameters for this
   * event handler must match the type of the payload for this event type.
   * @returns A cleanup function that can be invoked to unsubscribe.
   */
  // @ts-expect-error: Intentionally different type than `messenger.subscribe`.
  async subscribe<EventType extends UIMessengerEvents['type']>(
    eventType: EventType,
    handler: (
      ...payload: ExtractEventPayload<UIMessengerEvents, EventType>
    ) => void,
  ): Promise<() => Promise<void>> {
    // @ts-expect-error: Look into conflict.
    return await subscribeToMessengerEvent(eventType, handler);
  }
}

/**
 * Factory function to create a UI messenger instance.
 *
 * @returns A new instance of the UI messenger.
 */
export function createUIMessenger(): UIMessenger {
  return new UIMessenger();
}
