import type { Browser, Events } from 'webextension-polyfill';
import {
  BrowserInterface,
  Listener,
  Args,
  Options,
  BrowserNamespace,
  BrowserEventName,
  EventCallback,
  Entries,
  CallbackConstraint,
} from './extension-lazy-listener.types';

type ListenerInfo = {
  listener: Listener;
  args: Args[];
};

/**
 * A utility to lazily listen to browser extension events, buffering calls until
 * a real listener is added.
 */
export class ExtensionLazyListener<
  BrowserType extends BrowserInterface = Browser,
> {
  /**
   * The browser namespace, i.e., 'chrome' or 'browser'.
   */
  #browser: BrowserType;

  /**
   * Map of namespace to event name to listener info.
   */
  #namespaceListeners: Map<string, Map<string, ListenerInfo>> = new Map();

  /**
   * Creates an instance of ExtensionLazyListener.
   *
   * @param browser - The browser namespace, i.e., 'chrome' or 'browser'
   * @param events - The events to listen to.
   * @param timeout - The time in milliseconds to wait before warning about potential memory leaks. Default is 20000ms (20 seconds).
   */
  constructor(
    browser: BrowserType,
    events: Options<BrowserType> = {},
    timeout = 20000,
  ) {
    this.#browser = browser;
    for (const [namespace, eventNames] of Object.entries(events) as Entries) {
      const listeners = new Map();

      for (const eventName of eventNames) {
        const calls: Args[] = [];
        const listener = (...args: Args): void => {
          calls.push(args);
        };
        this.#getEvent(namespace, eventName).addListener(listener);
        listeners.set(eventName, { listener, args: calls });
      }

      this.#namespaceListeners.set(namespace, listeners);
    }

    this.#startWarningTimer(timeout);
  }

  /**
   * Starts a timer to warn about potential memory leaks.
   *
   * @param timeout - The time in milliseconds to wait before warning about potential memory leaks.
   */
  #startWarningTimer(timeout: number) {
    setTimeout(() => {
      // if there are still listeners after `timeout` ms, it means
      // we have a memory leak. Lets log to the console and give developers
      // clear instructions on how to investigate why this has happened.
      for (const [namespace, listeners] of this.#namespaceListeners) {
        for (const [eventName, { args: calls }] of listeners) {
          const message = `ExtensionLazyListener: Possible memory leak detected. The event "${namespace}.${eventName}" has been listened to, but no application code has added a listener after ${timeout}ms. There are currently ${calls.length} buffered calls. If you are a developer of this extension, please ensure that you have added a listener for this event. If you are a user of this extension, please report this warning to the developers of the extension.`;
          if (process.env.IN_TEST) {
            // error in tests
            console.error(message);
          } else {
            // warn in prod
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
  #getEvent(namespace: string, eventName: string) {
    // @ts-expect-error - we don't need valid types here, as we're just
    // doing this to cast to `Events.Event<...>`
    const event = this.#browser[namespace][eventName];
    return event as Events.Event<CallbackConstraint>;
  }

  /**
   * Adds a listener for the specified namespace and event name. If there are
   * any buffered calls, they will be synchronously invoked with the callback.
   *
   * @param namespace - The browser namespace, e.g., 'runtime', 'tabs', etc.
   * @param eventName - The event name within the namespace, e.g., 'onMessage', 'onInstalled', etc.
   * @param callback - The callback to invoke when the event is emitted.
   */
  public addListener<
    Namespace extends BrowserNamespace<BrowserType>,
    EventName extends BrowserEventName<BrowserType, Namespace>,
    Callback extends EventCallback<BrowserType, Namespace, EventName>,
  >(namespace: Namespace, eventName: EventName, callback: Callback) {
    const event = this.#getEvent(namespace, eventName);
    event.addListener(callback);

    const listeners = this.#namespaceListeners.get(namespace);
    if (listeners) {
      const tracker = listeners.get(eventName);
      if (tracker) {
        // we have a listener from the application, so we must:
        // 1. stop the lazy listener
        // 2. flush any buffered calls

        // 1. stop the lazy listener
        event.removeListener(tracker.listener);
        listeners.delete(eventName);
        // if the namespace has no more listeners, we can remove it
        if (listeners.size === 0) {
          this.#namespaceListeners.delete(namespace);
        }

        // 2. flush any buffered calls
        const { args } = tracker;
        for (let i = 0, { length } = args; i < length; i++) {
          try {
            callback(...args[i]);

            // if the application removed the listener during one of the
            // buffered calls, we need to stop flushing the rest of them.
            // we'll re-add the tracker below so the remaining calls can
            // be consumed later.
            if (!event.hasListener(callback)) {
              const next = i + 1;
              if (next !== length) {
                args.splice(0, next);
                listeners.set(eventName, tracker);
                this.#namespaceListeners.set(namespace, listeners);
                event.addListener(tracker.listener);
              }
              break;
            }
          } catch (e) {
            // if the `callback` throws, the current `args` _are_ used up, but
            // the remaining are still "good", so we need to put the tracker
            // back, in case another listener is added later.
            const next = i + 1;
            if (next !== length) {
              args.splice(0, next);
              listeners.set(eventName, tracker);
              this.#namespaceListeners.set(namespace, listeners);
              event.addListener(tracker.listener);
            }

            throw e;
          }
        }
      }
    }
  }

  /**
   * Returns a promise that resolves the next time the specified event is fired.
   * If the event has already been fired and buffered, it resolves
   * synchronously with the oldest buffered call.
   *
   * @param namespace - The browser namespace, e.g., 'runtime', 'tabs', etc.
   * @param eventName - The event name within the namespace, e.g., 'onMessage', 'onInstalled', etc.
   * @returns A promise that resolves with the event callback arguments.
   */
  public once<
    Namespace extends BrowserNamespace<BrowserType>,
    EventName extends BrowserEventName<BrowserType, Namespace>,
    Params extends Parameters<EventCallback<BrowserType, Namespace, EventName>>,
  >(namespace: Namespace, eventName: EventName) {
    return new Promise<Params>((resolve) => {
      const event = this.#getEvent(namespace, eventName);
      const listeners = this.#namespaceListeners.get(namespace);
      if (listeners) {
        const tracker = listeners.get(eventName);
        const length = tracker?.args.length;
        if (length) {
          resolve(tracker.args.shift() as Params);

          // we don't need our lazy listener anymore, since we know we have
          // application code that is capable of listening on its own. We _do_
          // keep any remaining `tracker.calls` around though, since we're only
          // consuming one call here, and there may be more to consume later.
          event.removeListener(tracker.listener);
          if (length === 1) {
            // if the tracker has no more calls, we can completely remove it
            listeners.delete(eventName);
            // if the namespace has no more listeners, we can remove it too
            if (listeners.size === 0) {
              this.#namespaceListeners.delete(namespace);
            }
          }
          return;
        }
      }
      // If we didn't have any buffered calls, we need to add a temporary
      // listener that will resolve the promise the next time the event is
      // emitted.
      const tempListener = (...args: Args) => {
        event.removeListener(tempListener);
        resolve(args as Params);
      };
      event.addListener(tempListener);
    });
  }
}
