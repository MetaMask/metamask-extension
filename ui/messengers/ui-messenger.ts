//========
// A file that defines the UI messenger could look something like this. (See
// `ui/index.js` for where `getUIMessenger` is called.) Once constructed, the UI
// messenger would be passed down the React component tree, where it would serve
// as the parent for more specific messengers.
//========

import {
  Messenger,
  type ActionConstraint,
  type ExtractActionParameters,
  type ExtractActionResponse,
  type ExtractEventPayload,
} from '@metamask/messenger';
import { JsonRpcNotification } from '@metamask/utils';

// We are only using the type here (though this should probably be in shared/).
// eslint-disable-next-line import/no-restricted-paths
import type { MetaRPCClient } from '../../app/scripts/lib/metaRPCClientFactory';
import type {
  RootMessengerActions,
  RootMessengerEvents,
  // We are only using the type here (though this should probably be in
  // shared/).
  // eslint-disable-next-line import/no-restricted-paths
} from '../../app/scripts/lib/messenger';
import { MESSENGER_SUBSCRIPTION_NOTIFICATION } from '../../shared/constants/messages';
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

// Also see `setupControllerConnection` in MetamaskController
type BackgroundApi = {
  call: <ActionType extends RootMessengerActions['type']>(
    actionType: ActionType,
    ...params: ExtractActionParameters<RootMessengerActions, ActionType>
  ) => ExtractActionResponse<RootMessengerActions, ActionType>;
  subscribe: <EventType extends RootMessengerEvents['type']>(
    eventType: EventType,
  ) => void;
  unsubscribe: <EventType extends RootMessengerEvents['type']>(
    eventType: EventType,
  ) => void;
};

type BackgroundApiClient = MetaRPCClient<BackgroundApi>;

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
  #backgroundApiClient: BackgroundApiClient;

  constructor(backgroundApiClient: BackgroundApiClient) {
    super({ namespace: UI_MESSENGER_NAMESPACE });
    this.#backgroundApiClient = backgroundApiClient;
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
  // @ts-expect-error This `call` is purposely not the same `call` from
  // `Messenger`.
  async call<ActionType extends UIMessengerActions['type']>(
    actionType: ActionType,
    ...params: ExtractActionParameters<UIMessengerActions, ActionType>
  ): Promise<Awaited<ExtractActionResponse<UIMessengerActions, ActionType>>> {
    const excludedActions: string[] = EXCLUDED_ACTIONS;
    const anyActionType: string = actionType;

    if (!excludedActions.includes(anyActionType)) {
      throw new Error(`Action '${actionType}' has not been exposed to the UI`);
    }

    const result = await this.#backgroundApiClient.send({
      method: 'messengerCall',
      // @ts-expect-error TODO - We're getting a type error here for some
      // unknown reason. That said, it might not matter, because we've already
      // confirmed that the action is valid above, and the background API is
      // backed by the root messenger, so if the action is not valid we
      // will get a(nother) runtime error.
      params: [actionType, ...params],
    });

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
  // @ts-expect-error This `subscribe` is purposely not the same `subscribe`
  // from `Messenger`.
  async subscribe<EventType extends UIMessengerEvents['type']>(
    eventType: EventType,
    handler: (
      ...payload: ExtractEventPayload<UIMessengerEvents, EventType>
    ) => void,
  ): Promise<() => Promise<void>> {
    await this.#backgroundApiClient.send({
      method: 'messengerSubscribe',
      params: [eventType],
    });

    const isMessengerSubscriptionNotification = (
      notification: JsonRpcNotification,
    ): notification is JsonRpcNotification & {
      params: [EventType, ExtractEventPayload<UIMessengerEvents, EventType>];
    } => {
      return (
        notification.method === MESSENGER_SUBSCRIPTION_NOTIFICATION &&
        Array.isArray(notification.params) &&
        notification.params[0] === eventType
      );
    };

    const listener = (notification: JsonRpcNotification) => {
      if (isMessengerSubscriptionNotification(notification)) {
        handler(...notification.params[1]);
      }
    };

    this.#backgroundApiClient.onNotification(listener);

    return () => {
      this.#backgroundApiClient.removeOnNotification(listener);
      return this.#backgroundApiClient.send({
        method: 'unsubscribe',
        params: [eventType],
      });
    };
  }
}

export function createUIMessenger(
  backgroundApiClient: BackgroundApiClient,
): UIMessenger {
  return new UIMessenger(backgroundApiClient);
}
