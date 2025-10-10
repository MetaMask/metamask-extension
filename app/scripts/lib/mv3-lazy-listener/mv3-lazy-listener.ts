import browser from 'webextension-polyfill';
import type { Events } from 'webextension-polyfill';
import type {
  BrowserEventName,
  BrowserNamespace,
  CallbackArguments,
} from './mx3-lazy-listener.types';

type EventRecord<
  Namespace extends BrowserNamespace,
  EventName extends BrowserEventName<Namespace>,
> = {
  listener: (...args: CallbackArguments<Namespace, EventName>) => void;
  calls: CallbackArguments<Namespace, EventName>[];
};

type NamespaceListenerMap = {
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
  ): typeof namespaceListeners;
};

/**
 * Get the event object for a given namespace and event name and ensure the
 * correct type
 *
 * @param namespace - the browser.* namespace, e.g. 'runtime'
 * @param eventName - the event name within that namespace, e.g. 'onMessage'
 */
function getEvent<
  Namespace extends BrowserNamespace,
  EventName extends BrowserEventName<Namespace>,
>(namespace: Namespace, eventName: EventName) {
  const event = browser[namespace][eventName];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return event as typeof event & Events.Event<any>;
}

/**
 * We keep all of our installed listeners and the events they have received so
 * far in this map.
 */
const namespaceListeners: NamespaceListenerMap = new Map<
  BrowserNamespace,
  Map<
    BrowserEventName<BrowserNamespace>,
    EventRecord<BrowserNamespace, BrowserEventName<BrowserNamespace>>
  >
>();

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
  let listeners = namespaceListeners.get(namespace);
  if (!listeners) {
    listeners = new Map();
    namespaceListeners.set(namespace, listeners);
  }
  for (const eventName of eventNames) {
    type Arguments = CallbackArguments<Namespace, typeof eventName>;
    const calls: Arguments[] = [];
    const listener = (...args: Arguments) => {
      calls.push(args);
    };
    getEvent(namespace, eventName).addListener(listener);
    listeners.set(eventName, { listener, calls });
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
  callback: (...args: CallbackArguments<Namespace, EventName>) => void,
) {
  const event = getEvent(namespace, eventName);

  // 1. install the listener for future events, as requested
  event.addListener(callback);

  // 2. replay old events and stop recording future events
  const trackers = namespaceListeners.get(namespace);
  if (trackers) {
    const tracker = trackers.get(eventName);
    if (tracker) {
      trackers.delete(eventName);
      event.removeListener(tracker.listener);
      setImmediate(() => {
        // finally, replay all the events that were recorded for this event
        tracker.calls.forEach((args) => callback(...args));
      });
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
    const event = getEvent(namespace, eventName);
    function listener(...args: CallbackArguments<Namespace, EventName>) {
      event.removeListener(listener);
      resolve(args);
    }

    const trackers = namespaceListeners.get(namespace);
    if (trackers) {
      const tracker = trackers.get(eventName);
      if (tracker && tracker.calls.length > 0) {
        // use the first recorded event
        // @ts-expect-error tracker.calls always has at least one item at this
        // point
        resolve(tracker.calls.shift());

        if (tracker.calls.length === 0) {
          trackers.delete(eventName);
          event.removeListener(tracker.listener);
        }
        return;
      }
    }
    event.addListener(namespace, eventName, listener);
  });
}

once('runtime', 'onInstalled').then(([details]) => {
  console.log(details);
});
