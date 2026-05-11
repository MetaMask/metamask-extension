import {
  Messenger,
  type ActionConstraint,
  type EventConstraint,
  type ExtractEventPayload,
} from '@metamask/messenger';
import type { Json } from '@metamask/utils';

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

/**
 * Keeps only actions whose parameters and return value are JSON-serializable,
 * since all actions go through the background connection.
 */
type WithJsonParams<Action extends ActionConstraint> =
  Action extends ActionConstraint
    ? Parameters<Action['handler']> extends Json[]
      ? Action
      : never
    : never;

/**
 * Keeps only events whose payload is JSON-serializable, since all events come
 * through the background connection.
 */
type WithJsonPayload<Event> = Event extends {
  payload: infer P extends unknown[];
}
  ? P extends Json[]
    ? Event
    : never
  : never;

export type UIMessengerActions = MakeActionsAsynchronous<
  WithJsonParams<Exclude<RootMessengerActions, { type: ExcludedActionTypes }>>
>;

export type UIMessengerEvents = WithJsonPayload<
  Exclude<RootMessengerEvents, { type: ExcludedEventTypes }>
>;

const UI_MESSENGER_NAMESPACE = 'UI';

type HandlerFunction = () => void | Promise<void>;

type UnsubscribeFunction = () => Promise<void>;

export class UIMessenger extends Messenger<
  typeof UI_MESSENGER_NAMESPACE,
  UIMessengerActions,
  UIMessengerEvents
> {
  /**
   * Background subscriptions established for delegated events, keyed by event
   * type. Each event type only needs one background subscription regardless of
   * how many route messengers have been delegated that event.
   */
  #delegatedEventSubscriptions: Map<
    UIMessengerEvents['type'],
    UnsubscribeFunction
  > = new Map();

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
   * Delegate actions and/or events to another messenger.
   *
   * This overrides the base implementation to additionally subscribe to
   * delegated events from the background connection, so that events emitted
   * by the background are forwarded to route messengers via the standard
   * delegation relay mechanism.
   *
   * @param args - Arguments for this function.
   * @param args.actions - The action types to delegate.
   * @param args.events - The event types to delegate.
   * @param args.messenger - The messenger to delegate to.
   */
  override delegate({
    actions,
    events,
    messenger,
  }: {
    actions?: UIMessengerActions['type'][];
    events?: UIMessengerEvents['type'][];
    messenger: Messenger<string, ActionConstraint, EventConstraint>;
  }): void {
    super.delegate({ actions, events, messenger });

    for (const eventType of events ?? []) {
      if (!this.#delegatedEventSubscriptions.has(eventType)) {
        subscribeToMessengerEvent(eventType, (...payload: unknown[]) => {
          // @ts-expect-error: The payload type cannot be statically verified
          // since it arrives as `unknown[]` from the background connection,
          // but the background always sends the correct payload for each
          // event type.
          this._internalPublishDelegated(eventType, ...payload);
        }).then((unsubscribe) => {
          this.#delegatedEventSubscriptions.set(eventType, unsubscribe);
        });
      }
    }
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
