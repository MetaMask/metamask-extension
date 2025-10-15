/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Browser, Events } from 'webextension-polyfill';
import type {
  BrowserEventName,
  BrowserNamespace,
  CallbackArguments,
  EventCallback,
  NamespaceListenerMap,
  NamespaceEventPair,
  Options,
} from './extension-lazy-listener.types';

/**
 * A utility to lazily listen to browser extension events, buffering calls until
 * a real listener is added.
 */
export class ExtensionLazyListener {
  private browser: Browser;

  private namespaceListeners: NamespaceListenerMap = new Map();

  /**
   * Creates an instance of ExtensionLazyListener.
   *
   * @param browser - The browser namespace, e.g., 'runtime', 'tabs', etc.
   * @param events - The events to listen to, specified as an array of namespace and event name pairs.
   * @param timeout - The time in milliseconds to wait before warning about potential memory leaks. Default is 20000ms (20 seconds).
   */
  constructor(browser: Browser, events: Options = [], timeout = 20000) {
    this.browser = browser;

    for (const { namespace, eventNames } of events) {
      this.#startListening({
        namespace,
        eventNames: eventNames as BrowserEventName<typeof namespace>[],
      });
    }

    setTimeout(() => {
      // if there are still listeners after `timeout` ms, it means
      // we have a memory leak. Lets warn in the console and give developers
      // clear instructions on how to investigate why this has happened.
      for (const [namespace, listeners] of this.namespaceListeners) {
        if (!listeners) {
          return;
        }
        for (const [eventName, { calls }] of listeners) {
          const message = `ExtensionLazyListener: Possible memory leak detected. The event "${namespace}.${eventName}" has been listened to, but no application code has added a listener after ${timeout}ms. There are currently ${calls.length} buffered calls. If you are a developer of this extension, please ensure that you have added a listener for this event. If you are a user of this extension, please report this warning to the developers of the extension.`;
          if (process.env.IN_TEST) {
            console.error(message);
          } else {
            console.warn(message);
          }
        }
      }
    }, timeout);
  }

  /**
   * Type safe way of getting an event from the browser namespace.
   *
   * @param namespace - The browser namespace, e.g., 'runtime', 'tabs', etc.
   * @param eventName - The event name within the namespace, e.g., 'onMessage', 'onInstalled', etc.
   * @returns The event object corresponding to the specified namespace and event name.
   */
  #getEvent<
    Namespace extends BrowserNamespace,
    EventName extends BrowserEventName<Namespace>,
  >(namespace: Namespace, eventName: EventName) {
    const event = this.browser[namespace][eventName];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return event as typeof event & Events.Event<any>;
  }

  /**
   * Starts listening to the specified namespace and event names, buffering
   * calls until a real listener is added.
   *
   * @param pair - The namespace and event names to start listening to.
   * @param pair.namespace
   * @param pair.eventNames
   */
  #startListening<
    Namespace extends BrowserNamespace,
    EventNames extends BrowserEventName<Namespace>[],
  >({ namespace, eventNames }: NamespaceEventPair<Namespace, EventNames>) {
    let listeners = this.namespaceListeners.get(namespace);
    if (!listeners) {
      listeners = new Map();
      this.namespaceListeners.set(namespace, listeners);
    }
    for (const eventName of eventNames) {
      type Args = CallbackArguments<Namespace, typeof eventName>;
      const calls: Args[] = [];
      const listener = (...args: Args): void => void calls.push(args);
      this.#getEvent(namespace, eventName).addListener(listener);
      listeners.set(eventName, { listener, calls });
    }
  }

  /**
   * Adds a listener for the specified namespace and event name. If there are
   * any buffered calls, they will be asynchronously invoked with the callback.
   *
   * @param namespace - The browser namespace, e.g., 'runtime', 'tabs', etc.
   * @param eventName - The event name within the namespace, e.g., 'onMessage', 'onInstalled', etc.
   * @param callback - The callback to invoke when the event is emitted.
   */
  public addListener<
    Namespace extends BrowserNamespace,
    EventName extends BrowserEventName<Namespace>,
  >(
    namespace: Namespace,
    eventName: EventName,
    callback: EventCallback<Namespace, EventName>,
  ) {
    const event = this.#getEvent(namespace, eventName);
    // take over from any lazy listeners
    event.addListener(callback);

    const trackers = this.namespaceListeners.get(namespace);
    if (trackers) {
      const tracker = trackers.get(eventName);
      if (tracker) {
        // we have a listener from the application, so we must:
        // 1. stop the lazy listener
        // 2. flush any buffered calls

        // 1. stop the lazy listener
        event.removeListener(tracker.listener);
        trackers.delete(eventName);
        // 2. flush any buffered calls
        while (tracker.calls.length && event.hasListener(callback)) {
          // we allow for the callback to call `removeListener`, which
          const args = tracker.calls.shift()!;
          // if a callback throws it will halt the flushing of any
          // remaining calls, there isn't a way to handle this that mirrors
          // the same behavior we'd see if we were listening "naturally",
          // unless we want to re-throw the error asynchronously, or swallow
          // it entirely. Both of those options seem bad, so we'll just let it
          // halt the flushing of any remaining calls.
          callback(...args);
        }
        // if the `tracker.calls` queue still has calls, we need to keep the
        // tracker around so they can be consumed later, so we add it back here.
        if (tracker.calls.length !== 0) {
          trackers.set(eventName, tracker);
        }
      }
    }
  }

  /**
   * Returns a promise that resolves the next time the specified event is fired.
   * If the event has already been fired and buffered, it resolves
   * asynchronously with the oldest buffered call.
   *
   * @param namespace - The browser namespace, e.g., 'runtime', 'tabs', etc.
   * @param eventName - The event name within the namespace, e.g., 'onMessage', 'onInstalled', etc.
   * @returns A promise that resolves with the event callback arguments.
   */
  public once<
    Namespace extends BrowserNamespace,
    EventName extends BrowserEventName<Namespace>,
  >(namespace: Namespace, eventName: EventName) {
    return new Promise<CallbackArguments<Namespace, EventName>>((resolve) => {
      const event = this.#getEvent(namespace, eventName);
      const listeners = this.namespaceListeners.get(namespace);
      if (listeners) {
        const tracker = listeners.get(eventName);
        if (tracker?.calls.length) {
          // Use setImmediate to ensure the Promise resolves asynchronously
          // just like it would if the event were emitted "naturally" after
          // calling `once(...)`
          setImmediate(
            resolve,
            tracker.calls.shift() as CallbackArguments<Namespace, EventName>,
          );
          // we don't need our lazy listener anymore, since we know we have
          // application code that is capable of listening on its own. We _do_
          // keep any remaining `tracker.calls` around though, since we're only
          // consuming one call here, and there may be more to consume later.
          event.removeListener(tracker.listener);
          if (tracker.calls.length === 0) {
            // if the tracker has no more calls, we can completely remove it
            listeners.delete(eventName);
          }
          return;
        }
      }
      // If we didn't have any buffered calls, we need to add a temporary
      // listener that will resolve the promise the next time the event is
      // emitted.
      const listener = (...args: CallbackArguments<Namespace, EventName>) => {
        event.removeListener(listener);
        resolve(args);
      };
      event.addListener(listener);
    });
  }
}
