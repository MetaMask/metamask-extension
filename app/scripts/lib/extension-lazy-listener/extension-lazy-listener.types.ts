// Added TypeDoc comments to each type and interface
import type { Browser, Events } from 'webextension-polyfill';

/**
 * Extracts the string keys from a given type.
 */
type StringKeys<Type> = Extract<keyof Type, string>;

/**
 * Represents any event in the `Events.Event` type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEvent = Events.Event<(...args: any[]) => unknown>;

/**
 * Extracts the keys of events from a specific namespace in the `Browser` object.
 *
 * @template NamespaceKey - The key of the namespace in the `Browser` object.
 */
type EventKeys<NamespaceKey extends keyof Browser> = Extract<
  StringKeys<Browser[NamespaceKey]>,
  {
    [Key in StringKeys<
      Browser[NamespaceKey]
    >]: Browser[NamespaceKey][Key] extends AnyEvent ? Key : never;
  }[StringKeys<Browser[NamespaceKey]>]
>;

/**
 * Represents the name of an event in a specific namespace of the `Browser` object.
 *
 * @template NamespaceKey - The key of the namespace in the `Browser` object.
 */
export type BrowserEventName<NamespaceKey extends keyof Browser> =
  EventKeys<NamespaceKey>;

/**
 * Extracts the callback type for a specific event in a namespace of the `Browser` object.
 *
 * @template NamespaceKey - The key of the namespace in the `Browser` object.
 * @template EventName - The name of the event in the namespace.
 */
export type EventCallback<
  NamespaceKey extends keyof Browser,
  EventName extends keyof Browser[NamespaceKey],
> =
  Browser[NamespaceKey][EventName] extends Events.Event<infer CallbackType>
    ? CallbackType
    : never;

/**
 * Represents the arguments of a callback for a specific event in a namespace of the `Browser` object.
 *
 * @template NamespaceKey - The key of the namespace in the `Browser` object.
 * @template EventName - The name of the event in the namespace.
 */
export type CallbackArguments<
  NamespaceKey extends keyof Browser,
  EventName extends keyof Browser[NamespaceKey] = keyof Browser[NamespaceKey],
> = Parameters<EventCallback<NamespaceKey, EventName>>;

/**
 * Represents a record of an event, including its listener and the calls made to it.
 *
 * @template NamespaceKey - The key of the namespace in the `Browser` object.
 * @template EventName - The name of the event in the namespace.
 */
type EventRecord<
  NamespaceKey extends keyof Browser,
  EventName extends keyof Browser[NamespaceKey],
> = {
  listener: EventCallback<NamespaceKey, EventName>;
  calls: CallbackArguments<NamespaceKey, EventName>[];
};

/**
 * Represents the namespaces in the `Browser` object that have events.
 */
export type BrowserNamespace = {
  [NamespaceKey in keyof Browser]-?: EventKeys<NamespaceKey> extends never
    ? never
    : NamespaceKey;
}[keyof Browser] &
  string;

/**
 * Represents a map of event names to their corresponding event records for a specific namespace.
 *
 * @template NamespaceKey - The key of the namespace in the `Browser` object.
 */
type NamespaceEventMap<NamespaceKey extends keyof Browser> = Map<
  BrowserEventName<NamespaceKey>,
  EventRecord<NamespaceKey, BrowserEventName<NamespaceKey>>
>;

/**
 * Represents a tuple containing a namespace and its corresponding event map.
 */
type TupleThing = {
  [NamespaceKey in keyof Browser]-?: EventKeys<NamespaceKey> extends never
    ? never
    : [NamespaceKey, NamespaceEventMap<NamespaceKey>];
}[keyof Browser];

/**
 * Represents a map of namespace listeners, allowing retrieval and setting of event maps for namespaces.
 */
export interface NamespaceListenerMap extends Iterable<TupleThing> {
  /**
   * Retrieves the event map for a specific namespace.
   *
   * @param ns - The namespace to retrieve the event map for.
   * @returns The event map for the namespace, or `undefined` if not found.
   */
  get<NamespaceKey extends BrowserNamespace>(
    ns: NamespaceKey,
  ): NamespaceEventMap<NamespaceKey> | undefined;

  /**
   * Sets the event map for a specific namespace.
   *
   * @param ns - The namespace to set the event map for.
   * @param value - The event map to set.
   * @returns The updated `NamespaceListenerMap` instance.
   */
  set<NamespaceKey extends BrowserNamespace>(
    ns: NamespaceKey,
    value: NamespaceEventMap<NamespaceKey>,
  ): this;
}

/**
 * Represents the options for initializing the `ExtensionLazyListener`.
 *
 * Each option specifies a namespace and the event names to listen to within that namespace.
 */
export type Options = {
  [NamespaceKey in keyof Browser]-?: EventKeys<NamespaceKey> extends never
    ? never
    : {
        namespace: NamespaceKey;
        eventNames: BrowserEventName<NamespaceKey>[];
      };
}[keyof Browser][];

export type NamespaceEventPair<
  Namespace extends BrowserNamespace,
  EventNames extends BrowserEventName<Namespace>[],
> = {
  namespace: Namespace;
  eventNames: EventNames;
};
