// Added TypeDoc comments to each type and interface
import type { Browser, Events } from 'webextension-polyfill';

/**
 * Extracts the string keys from a given type.
 */
type StringKeys<Type> = Extract<keyof Type, string>;

/**
 * Represents any event in the `Events.Event` type.
 */
/**
 * Returns true for events whose callback return type includes void (either exactly void or a union containing void).
 */
type HasVoid<Type> = [Extract<Type, void>] extends [never] ? false : true;

/**
 * Predicate for permitted events: the underlying callback may return void or a union containing void.
 */
export type AnyEvent<
  NamespaceKey extends keyof Browser,
  EventName extends keyof Browser[NamespaceKey],
> =
  Browser[NamespaceKey][EventName] extends Events.Event<
    (...args: infer _Args) => infer ReturnType
  >
    ? HasVoid<ReturnType> extends true
      ? true
      : never
    : never;

/**
 * Extracts the keys of events from a specific namespace in the `Browser` object.
 *
 * @template NamespaceKey - The key of the namespace in the `Browser` object.
 */
type EventKeys<NamespaceKey extends keyof Browser> = {
  [Key in StringKeys<Browser[NamespaceKey]>]: true extends AnyEvent<
    NamespaceKey,
    Key
  >
    ? Key
    : never;
}[StringKeys<Browser[NamespaceKey]>];

/**
 * Represents the name of an event in a specific namespace of the `Browser` object.
 *
 * @template NamespaceKey - The key of the namespace in the `Browser` object.
 */
export type BrowserEventName<NamespaceKey extends keyof Browser> = Extract<
  EventKeys<NamespaceKey>,
  string
>;

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
  true extends AnyEvent<NamespaceKey, EventName>
    ? Browser[NamespaceKey][EventName] extends Events.Event<infer CallbackType>
      ? CallbackType extends (...args: infer P) => unknown
        ? // Coerce any allowed callback (void or void-union) to a strictly void-returning version
          (...args: P) => void
        : never
      : never
    : never;

/**
 * Represents the arguments of a callback for a specific event in a namespace of the `Browser` object.
 *
 * @template NamespaceKey - The key of the namespace in the `Browser` object.
 * @template EventName - The name of the event in the namespace.
 */
export type CallbackArguments<
  NamespaceKey extends keyof Browser,
  EventName extends keyof Browser[NamespaceKey],
> = Parameters<EventCallback<NamespaceKey, EventName>>;

/**
 * Represents a record of an event, including its listener and the calls made to it.
 *
 * @template NamespaceKey - The key of the namespace in the `Browser` object.
 * @template EventName - The name of the event in the namespace.
 */
// Bivariant listener helper to ease storage in a Map with heterogeneous parameter tuples.
// (Parameter bivariance is acceptable here because we never invoke a stored listener with
// arguments for a different event key.)
type BivariantListener<Args extends unknown[]> = {
  bivarianceHack(...args: Args): void;
}['bivarianceHack'];

type EventRecord = {
  // Stored in a widened, bivariant form to avoid parameter tuple unification issues across heterogeneous events.
  listener: BivariantListener<unknown[]>;
  // Calls stored erasing the precise tuple type; callers re-narrow at usage sites.
  calls: unknown[];
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
  EventRecord
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
export type NamespaceListenerMap = {
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
  ): NamespaceListenerMap;
} & Iterable<TupleThing>;

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

export type NamespaceEventPair<Namespace extends BrowserNamespace> = {
  namespace: Namespace;
  eventNames: BrowserEventName<Namespace>[];
};
