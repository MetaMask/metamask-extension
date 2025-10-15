import type { Browser, Events } from 'webextension-polyfill';

/**
 * Represents any Events.Event event in the `browser` namespace.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEvent = Events.Event<(...args: any[]) => void>;

/**
 * Only string keys.
 */
type StringKeys<Thing> = Extract<keyof Thing, string>;

/**
 * Keys of T whose values are Events.Event<…>
 */
type EventKeys<Namespace extends keyof Browser> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [EventName in StringKeys<
    Browser[Namespace]
  >]-?: Browser[Namespace][EventName] extends AnyEvent ? EventName : never;
}[StringKeys<Browser[Namespace]>];

export type BrowserNamespace = Options[number]['namespace'];

export type BrowserEventName<Namespace extends BrowserNamespace> =
  EventKeys<Namespace>;

export type EventCallback<
  Namespace extends BrowserNamespace,
  EventName extends keyof Browser[Namespace],
> =
  Browser[Namespace][EventName] extends Events.Event<infer Callback>
    ? Callback
    : never;

export type CallbackArguments<
  Namespace extends BrowserNamespace,
  EventName extends keyof Browser[Namespace] = keyof Browser[Namespace],
> = Parameters<EventCallback<Namespace, EventName>>;

type EventRecord<
  Namespace extends BrowserNamespace,
  EventName extends keyof Browser[Namespace],
> = {
  listener: (...args: CallbackArguments<Namespace, EventName>) => void;
  calls: CallbackArguments<Namespace, EventName>[];
};

type TupleThing = {
  [Namespace in keyof Browser]: EventKeys<Namespace> extends never
    ? never
    : [
        Namespace,
        {
          [EventName in keyof Browser[Namespace]]: Browser[Namespace][EventName] extends AnyEvent
            ? Map<
                EventName,
                Namespace extends BrowserNamespace
                  ? EventRecord<
                      Namespace,
                      EventName & BrowserEventName<Namespace>
                    >
                  : never
              >
            : never;
        }[keyof Browser[Namespace]],
      ];
}[keyof Browser];

export type NamespaceListenerMap = {
  [Symbol.iterator](): IterableIterator<TupleThing>;
  get<
    Namespace extends BrowserNamespace,
    EventName extends BrowserEventName<Namespace> = BrowserEventName<Namespace>,
  >(
    key: Namespace,
  ): Map<EventName, EventRecord<Namespace, EventName>> | undefined;
  set<
    Namespace extends BrowserNamespace,
    EventName extends BrowserEventName<Namespace> = BrowserEventName<Namespace>,
  >(
    key: Namespace,
    value: Map<EventName, EventRecord<Namespace, EventName>>,
  ): NamespaceListenerMap;
};

/**
 * Options for initializing the ExtensionLazyListener.
 *
 * A map of BrowserNamespace to event names to listen to.
 */
export type Options = {
  [Namespace in keyof Browser]: EventKeys<Namespace> extends never
    ? never
    : {
        namespace: Namespace;
        eventNames: {
          [EventName in keyof Browser[Namespace]]: Browser[Namespace][EventName] extends AnyEvent
            ? EventName
            : never;
        }[keyof Browser[Namespace]][];
      };
}[keyof Browser][];
