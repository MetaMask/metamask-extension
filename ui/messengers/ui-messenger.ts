import {
  Messenger,
  MessengerActions,
  MessengerEvents,
  type ActionConstraint,
  type EventConstraint,
  type ExtractEventPayload,
  ExtractEventHandler,
  ActionHandler,
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

const EXCLUDED_ACTIONS: string[] = MESSENGERS_WITH_EXCLUSIONS.flatMap(
  (config) => config.EXCLUDED_CAPABILITIES.actions,
);

type MessengerWithExclusions = (typeof MESSENGERS_WITH_EXCLUSIONS)[number];
type ExcludedActionTypes =
  MessengerWithExclusions['EXCLUDED_CAPABILITIES']['actions'][number];
type ExcludedEventTypes =
  MessengerWithExclusions['EXCLUDED_CAPABILITIES']['events'][number];

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
  Exclude<RootMessengerActions, { type: ExcludedActionTypes }>
>;

export type UIMessengerEvents = WithJsonPayload<
  Exclude<RootMessengerEvents, { type: ExcludedEventTypes }>
>;

/**
 * A messenger that actions and/or events can be delegated to.
 *
 * This is a minimal type interface to avoid complex incompatibilities resulting from generics over
 * invariant types.
 */
type DelegatedMessenger = Pick<
  // The type is broadened to all actions/events because some messenger methods
  // are contravariant over this type (`registerDelegatedActionHandler` and
  // `publishDelegated` for example). If this type is narrowed to just the
  // delegated actions/events, the types for event payload and action parameters
  // would not be wide enough.
  Messenger<string, ActionConstraint, EventConstraint>,
  | '_internalPublishDelegated'
  | '_internalRegisterDelegatedActionHandler'
  | '_internalUnregisterDelegatedActionHandler'
  | 'captureException'
>;

// We intentionally don't extend the base `Messenger` class here because the UI
// messenger doesn't need to implement the full messenger API. It's only used as
// a bridge between the root messenger and the route messengers, and it
// delegates all of its actions and events to the root messenger by default, so
// it doesn't need to implement the full API itself.
export class UIMessenger {
  /**
   * The set of messengers we've delegated actions to, by action type.
   */
  readonly #actionDelegationTargets = new Map<
    UIMessengerActions['type'],
    Set<DelegatedMessenger>
  >();

  /**
   * The set of messengers we've delegated events to and their event handlers, by event type.
   */
  readonly #subscriptionDelegationTargets = new Map<
    UIMessengerEvents['type'],
    Map<DelegatedMessenger, () => Promise<void>>
  >();

  /**
   * Delegate actions and events to a given messenger.
   *
   * Actions will be delegated by registering a handler on the delegatee
   * messenger that submits a request to the background for the given action
   * type and parameters. Events will be delegated by subscribing to the event
   * on the root messenger and publishing it on the delegatee messenger when it
   * occurs.
   *
   * @param options - The delegation options.
   * @param options.actions - The action types to delegate.
   * @param options.events - The event types to delegate.
   * @param options.messenger - The messenger to delegate to.
   * @throws If any action type has already been delegated to this messenger, or
   * if any event type has already been delegated to this messenger.
   */
  async delegate<
    Delegatee extends Messenger<string, ActionConstraint, EventConstraint>,
    DelegatedActions extends (MessengerActions<Delegatee>['type'] &
      UIMessengerActions['type'])[],
    DelegatedEvents extends (MessengerEvents<Delegatee>['type'] &
      UIMessengerEvents['type'])[],
  >({
    actions,
    events,
    messenger,
  }: {
    actions?: DelegatedActions;
    events?: DelegatedEvents;
    messenger: Delegatee;
  }): Promise<void> {
    for (const actionType of actions ?? []) {
      // The action's parameter and response types would have to be extracted
      // from `RootMessengerActions`, a union too large for TypeScript to index
      // into per action without overflowing (TS2590). Every action crosses the
      // background connection as JSON, so type the handler with that shape and
      // cast it when registering below.
      const delegatedActionHandler = (...args: Json[]): Promise<Json> => {
        if (EXCLUDED_ACTIONS.includes(actionType)) {
          throw new Error(
            `The action "${actionType}" has not been exposed to the UI.`,
          );
        }

        return submitRequestToBackground('messengerCall', [
          actionType as string,
          args,
        ]);
      };

      let delegationTargets = this.#actionDelegationTargets.get(actionType);
      if (!delegationTargets) {
        delegationTargets = new Set<DelegatedMessenger>();
        this.#actionDelegationTargets.set(actionType, delegationTargets);
      }

      if (delegationTargets.has(messenger)) {
        throw new Error(
          `The action "${actionType}" has already been delegated to this messenger.`,
        );
      }

      delegationTargets.add(messenger);

      // Intentionally calling a "deprecated" method here, since this is the
      // internal API for delegation.
      messenger._internalRegisterDelegatedActionHandler(
        actionType,
        delegatedActionHandler as ActionHandler<
          Extract<UIMessengerActions, { type: typeof actionType }>,
          typeof actionType
        >,
      );
    }

    const promises = (events ?? []).map(async (eventType) => {
      const untypedSubscriber = (
        ...payload: ExtractEventPayload<
          MessengerEvents<Delegatee> & UIMessengerEvents,
          typeof eventType
        >
      ): void => {
        // Intentionally calling a "deprecated" method here, since this is the
        // internal API for delegation.
        messenger._internalPublishDelegated(eventType, ...payload);
      };

      // Cast to get more specific subscriber type for this specific event.
      // The types get collapsed here to the type union of all delegated
      // events, rather than the single subscriber type corresponding to this
      // event.
      const subscriber = untypedSubscriber as ExtractEventHandler<
        MessengerEvents<Delegatee> & UIMessengerEvents,
        typeof eventType
      >;

      let delegatedEventSubscriptions =
        this.#subscriptionDelegationTargets.get(eventType);

      if (!delegatedEventSubscriptions) {
        delegatedEventSubscriptions = new Map();
        this.#subscriptionDelegationTargets.set(
          eventType,
          delegatedEventSubscriptions,
        );
      }

      if (delegatedEventSubscriptions.has(messenger)) {
        throw new Error(
          `The event '${eventType}' has already been delegated to this messenger`,
        );
      }

      const unsubscribe = await subscribeToMessengerEvent(
        eventType,
        subscriber,
      );

      delegatedEventSubscriptions.set(messenger, unsubscribe);
    });

    await Promise.all(promises);
  }

  /**
   * Revoke delegation of actions and events to a given messenger.
   *
   * This is essentially the inverse of `delegate`, and will remove the
   * delegated action handlers and event subscriptions that were added in
   * `delegate`.
   *
   * @param options - The revocation options.
   * @param options.actions - The action types to revoke delegation for.
   * @param options.events - The event types to revoke delegation for.
   * @param options.messenger - The messenger to revoke delegation from.
   * @returns A promise that resolves when the revocation is complete.
   */
  async revoke<
    Delegatee extends Messenger<string, ActionConstraint, EventConstraint>,
    DelegatedActions extends (MessengerActions<Delegatee>['type'] &
      UIMessengerActions['type'])[],
    DelegatedEvents extends (MessengerEvents<Delegatee>['type'] &
      UIMessengerEvents['type'])[],
  >({
    actions,
    events,
    messenger,
  }: {
    actions?: DelegatedActions;
    events?: DelegatedEvents;
    messenger: Delegatee;
  }): Promise<void> {
    for (const actionType of actions ?? []) {
      const delegationTargets = this.#actionDelegationTargets.get(actionType);
      if (!delegationTargets?.has(messenger)) {
        // Nothing to revoke.
        continue;
      }

      // Intentionally calling a "deprecated" method here, since this is the
      // internal API for delegation.
      messenger._internalUnregisterDelegatedActionHandler(actionType);
      delegationTargets.delete(messenger);

      if (delegationTargets.size === 0) {
        this.#actionDelegationTargets.delete(actionType);
      }
    }

    for (const eventType of events ?? []) {
      const delegationTargets =
        this.#subscriptionDelegationTargets.get(eventType);

      if (!delegationTargets) {
        // Nothing to revoke.
        continue;
      }

      const unsubscribe = delegationTargets.get(messenger);
      if (!unsubscribe) {
        // Nothing to revoke.
        continue;
      }

      await unsubscribe();
      delegationTargets.delete(messenger);

      if (delegationTargets.size === 0) {
        this.#subscriptionDelegationTargets.delete(eventType);
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
