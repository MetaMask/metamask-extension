import type { Browser, Events } from 'webextension-polyfill';

/** Only string keys (avoid number/symbol widening). */
type StringKeys<Thing> = Extract<keyof Thing, string>;

/** Keys of T whose values are Events.Event<…> */
export type EventKeys<Thing> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in StringKeys<Thing>]-?: Thing[K] extends Events.Event<any> ? K : never;
}[StringKeys<Thing>];

/**
 * Browser namespaces that have event keys.
 * e.g. 'runtime', 'tabs', 'webRequest', etc.
 */
export type BrowserNamespace = Extract<
  {
    [Key in keyof Browser]-?: EventKeys<Browser[Key]> extends never
      ? never
      : Key;
  }[keyof Browser],
  string
>;

/**
 * Event names within a given namespace that are of type Events.Event<…>.
 * e.g. for 'runtime', this would include `'onMessage'`, `'onInstalled'`, etc.
 */
export type BrowserEventName<Namespace extends BrowserNamespace> = EventKeys<
  Browser[Namespace]
>;

/**
 * The listener function type for a given namespace and event name.
 * (e.g. for `runtime.onMessage`, this would be `(message: any, sender: MessageSender, sendResponse: (response?: any) => void) => void)`
 */
type EventCallback<
  Namespace extends BrowserNamespace,
  EventName extends BrowserEventName<Namespace>,
> = Browser[Namespace][EventName] extends Events.Event<infer Fn> ? Fn : never;

/**
 * The callback's argument types for a given namespace and event name.
 * (e.g. for `runtime.onMessage`, this would be `[message: any, sender: MessageSender, sendResponse: (response?: any) => void])`
 */
export type CallbackArguments<
  Namespace extends BrowserNamespace,
  EventName extends BrowserEventName<Namespace> = BrowserEventName<Namespace>,
> = Parameters<EventCallback<Namespace, EventName>>;

/**
 * Represents a namespace + eventName pair for listener registration.
 */
export type NamespaceEventPair = {
  namespace: BrowserNamespace;
  eventNames: BrowserEventName<BrowserNamespace>[];
  eventName: BrowserEventName<BrowserNamespace>;
};

/**
 * Strongly-typed version for generic use (for internal typing, not for user input)
 */
export type NamespaceEventPairTyped<
  Namespace extends BrowserNamespace = BrowserNamespace,
  EventNames extends
    BrowserEventName<Namespace>[] = BrowserEventName<Namespace>[],
> = {
  namespace: Namespace;
  eventNames: EventNames;
};
