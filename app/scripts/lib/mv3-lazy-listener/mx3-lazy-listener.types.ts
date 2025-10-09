import browser from 'webextension-polyfill';
import type { Events } from 'webextension-polyfill';

type Browser = typeof browser;

/**
 * This is used to filter out namespaces that do not have any methods that
 * implement `addListener` and `removeListener` (`Events.Event`).
 */
type HasEvent<Type> = {
  [K in keyof Type]: Type[K] extends Events.Event<infer _> ? K : never;
}[keyof Type];

/**
 * The names of all properties in `browser.*` that have methods that include
 * `addListener` and `removeListener`.
 */
export type BrowserNamespace = Extract<
  {
    [N in keyof Browser]: HasEvent<Browser[N]> extends never ? never : N;
  }[keyof Browser],
  string
>;

/**
 * The names of all events in `browser.*` that support `addListener` and `removeListener`.
 */
export type BrowserEventName<Namespace extends BrowserNamespace> = Extract<
  Namespace extends any ? HasEvent<Browser[Namespace]> : never,
  string
>;

/**
 * The argument types for the listener function of a given browser.* event.
 */
export type ListenerArguments<
  Namespace extends BrowserNamespace,
  EventName extends BrowserEventName<Namespace>,
> =
  Browser[Namespace][EventName] extends Events.Event<infer _>
    ? Parameters<Browser[Namespace][EventName]['addListener']>
    : never;

/**
 * The argument types for the callback function of a given browser.* event.
 */
export type CallbackArguments<
  Namespace extends BrowserNamespace,
  EventName extends BrowserEventName<Namespace> = BrowserEventName<Namespace>,
> = Parameters<ListenerArguments<Namespace, EventName>[0]>;
