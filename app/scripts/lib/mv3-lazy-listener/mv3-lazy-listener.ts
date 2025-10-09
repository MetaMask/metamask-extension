import browser from 'webextension-polyfill';
import type {
  BrowserEventName,
  BrowserNamespace,
  CallbackArguments,
  ListenerArguments,
} from './mx3-lazy-listener.types';

type Tracker<Namespace extends BrowserNamespace> = {
  listener: (
    ...args: CallbackArguments<Namespace, BrowserEventName<Namespace>>
  ) => void;
  calls: CallbackArguments<Namespace>[];
};

/**
 * We keep all of our installed listeners and the events they have received so
 * far in this map.
 */
const namespaceListeners = (() => {
  const store = new Map();
  return {
    get: <Namespace extends BrowserNamespace>(
      namespace: Namespace,
    ): Map<BrowserEventName<Namespace>, Tracker<Namespace>> | undefined =>
      store.get(namespace),
    set: <Namespace extends BrowserNamespace>(
      namespace: Namespace,
      value: Map<BrowserEventName<Namespace>, Tracker<Namespace>>,
    ) => store.set(namespace, value),
  };
})();

/**
 * Install listeners for multiple browser.* events.
 *
 * @param namespace
 * @param eventNames - the names of the events to listen for
 */
export function install<
  Namespace extends BrowserNamespace,
  EventNames extends BrowserEventName<Namespace>[],
>(namespace: Namespace, eventNames: EventNames) {
  let runtimeListeners = namespaceListeners.get(namespace);
  if (!runtimeListeners) {
    runtimeListeners = new Map();
    namespaceListeners.set(namespace, runtimeListeners);
  }
  for (const eventName of eventNames) {
    type Arguments = CallbackArguments<Namespace, typeof eventName>;
    const calls: Arguments[] = [];
    const listener = (...args: Arguments) => {
      calls.push(args);
    };
    browser[namespace][eventName].addListener(listener);
    runtimeListeners.set(eventName, { listener, calls });
  }
}

/**
 * Add a listener for a browser[namespace] event, replaying any events that were
 * received before the listener was added.
 *
 * @param namespace
 * @param eventName - the name of the event to listen for
 * @param callback - the callback to invoke when the event is received
 */
export function addListener<
  Namespace extends BrowserNamespace,
  EventName extends BrowserEventName<Namespace>,
>(
  namespace: Namespace,
  eventName: EventName,
  callback: ListenerArguments<Namespace, EventName>[0],
) {
  // 1. add the listener for _future_ events
  // 2. if this is an event we have recorded events for, replay them now

  // 1. install the listener for future events, as requested
  browser[namespace][eventName].addListener(callback);

  // 2. replay old events and stop recording future events
  const listeners = namespaceListeners.get(namespace);
  if (listeners) {
    const event = listeners.get(eventName as any);
    if (event) {
      listeners.delete(eventName as any);
      browser[namespace][eventName].removeListener(event.listener);

      // finally, replay all the events that were recorded for this event
      event.calls.forEach((args) => callback(...args));
    }
  }
}

/**
 * Wait for the next occurrence of a browser[namespace] event.
 *
 * @param namespace
 * @param eventName - the name of the event to listen for
 * @returns a promise that resolves with the arguments of the next event
 * of the given name
 */
export function once<
  Namespace extends BrowserNamespace,
  EventName extends BrowserEventName<Namespace>,
>(namespace: Namespace, eventName: EventName) {
  return new Promise<CallbackArguments<Namespace, EventName>>((resolve) => {
    function listener(...args: CallbackArguments<Namespace, EventName>) {
      browser[namespace][eventName].removeListener(listener);
      resolve(args);
    }

    addListener(namespace, eventName, listener);
  });
}
