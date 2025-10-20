import type { Events } from 'webextension-polyfill';

/**
 * Extracts the event names from a given browser namespace that correspond to
 * Events.Event with *void* return type. See {@link BrowserNamespace} for more
 * details.
 */
export type BrowserEventName<
  Browser,
  Namespace extends keyof Browser,
> = Extract<
  {
    [EventKey in keyof Browser[Namespace]]: Browser[Namespace][EventKey] extends Events.Event<
      infer Callback
    >
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Callback extends (...args: any[]) => infer ReturnValue
        ? ReturnValue extends void
          ? EventKey
          : never
        : never
      : never;
  }[keyof Browser[Namespace]],
  string
>;

/**
 * Extracts the browser namespaces that have at least one event corresponding to
 * Events.Event with *void* return type. As we can't return anything from the
 * initial lazy listener, so we just don't support those events.
 */
export type BrowserNamespace<Browser> = Extract<
  {
    [NamespaceKey in keyof Browser]: {
      [EventKey in keyof Browser[NamespaceKey]]: Browser[NamespaceKey][EventKey] extends Events.Event<
        infer Callback
      >
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Callback extends (...args: any[]) => infer ReturnValue
          ? ReturnValue extends void
            ? NamespaceKey
            : never
          : never
        : never;
    }[keyof Browser[NamespaceKey]];
  }[keyof Browser],
  string
>;

/**
 * Extracts the callback type for a given browser namespace and event name.
 */
export type EventCallback<
  BrowserType,
  Namespace extends keyof BrowserType,
  EventName extends keyof BrowserType[Namespace],
> =
  BrowserType[Namespace][EventName] extends Events.Event<infer Callback>
    ? Callback
    : never;

export type Options<Browser> = {
  [NamespaceName in BrowserNamespace<Browser>]?: BrowserEventName<
    Browser,
    NamespaceName
  >[];
};

/**
 * Arguments passed to event listeners.
 */
export type Args = unknown[];

/**
 * Event Listener function type.
 */
export type Listener = (...args: Args) => void;

/**
 * Generic browser interface type.
 */
export type BrowserInterface = NonNullable<unknown>;

/**
 * Entries of the Options object as tuples. This is a slightly better type for
 * with `Object.entries`.
 */
export type Entries = [string, string[]][];
