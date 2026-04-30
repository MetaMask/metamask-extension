import {
  Messenger,
  type ActionConstraint,
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
import { captureException } from '../../shared/lib/sentry';
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
    super({ namespace: UI_MESSENGER_NAMESPACE, captureException });
  }

  /**
   * Get the handler for a given action type.
   *
   * This is called when `call` is invoked on the messenger. We override it here
   * to route all calls through the background connection, except for the
   * excluded actions.
   *
   * @param actionType - The action type. This is a unique identifier for this
   * action.
   * @returns The handler for this action type, or undefined if this action type
   * is excluded or not found.
   */
  protected override getAction(
    actionType: UIMessengerActions['type'],
  ): ActionConstraint['handler'] | undefined {
    if (EXCLUDED_ACTIONS.includes(actionType)) {
      throw new Error(
        `The action "${actionType}" has not been exposed to the UI.`,
      );
    }

    return (...args: unknown[]) =>
      submitRequestToBackground('messengerCall', [actionType, args]);
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
    // @ts-expect-error: `subscribeToMessengerEvent` is typed to only accept
    // events returning JSON-serializable payloads, but `UIMessengerEvents` may
    // include events with non-serializable payloads.
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
