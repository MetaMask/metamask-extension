/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Browser, Events, Urlbar } from 'webextension-polyfill';
import type {
  BrowserEventName,
  BrowserNamespace,
  CallbackArguments,
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
    // Cast to an Event whose callback parameters match the coerced CallbackArguments for this event.
    return event as Events.Event<
      (...args: CallbackArguments<Namespace, EventName>) => void
    >;
  }

  /**
   * Starts listening to the specified namespace and event names, buffering
   * calls until a real listener is added.
   *
   * @param pair - The namespace and event names to start listening to.
   * @param pair.namespace
   * @param pair.eventNames
   */
  #startListening<Namespace extends BrowserNamespace>({
    namespace,
    eventNames,
  }: NamespaceEventPair<Namespace>) {
    let listeners = this.namespaceListeners.get(namespace);
    if (!listeners) {
      listeners = new Map();
      this.namespaceListeners.set(namespace, listeners);
    }
    const createEventRecord = <
      SpecificEventName extends BrowserEventName<Namespace>,
    >(
      ev: SpecificEventName,
    ) => {
      type Params = CallbackArguments<Namespace, SpecificEventName>;
      const calls: Params[] = [];
      const listener = (...args: Params) => {
        calls.push(args);
      };
      this.#getEvent(namespace, ev).addListener(listener);
      return { listener, calls } satisfies {
        listener: (...args: Params) => void;
        calls: Params[];
      };
    };
    for (const ev of eventNames) {
      listeners.set(ev, createEventRecord(ev));
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
    // Capture the user's callback as generic UserCallback so we can inspect its return type
    UserCallback extends (
      ...args: CallbackArguments<Namespace, EventName>
    ) => unknown,
  >(
    namespace: Namespace,
    eventName: EventName,
    // Enforce that the callback's return type is (contextually) void.
    // If ReturnType<C> is not void, we intersect with a required property that the
    // provided function value will not have, producing a type error.
    // NOTE: This still allows users to force an annotation of `: void` and return a value,
    // which TypeScript permits, but it restores an error for the common accidental case
    // like `(...): boolean => true`.
    callback: UserCallback &
      (ReturnType<UserCallback> extends void
        ? // eslint-disable-next-line @typescript-eslint/ban-types
          NonNullable<unknown>
        : { _mustReturnVoidReturnTypeExpected: never }),
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
          const argTuple =
            tracker.calls.shift() as unknown as CallbackArguments<
              Namespace,
              EventName
            >; // Narrow back to specific event's argument tuple
          callback(...argTuple);
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
          const nextArgs =
            tracker.calls.shift() as unknown as CallbackArguments<
              Namespace,
              EventName
            >;
          setImmediate(resolve, nextArgs);
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

// Examples of problematic namespaces/events:

// runtime.onMessage allows for a non-void return type
declare const browser: Browser;
const a = new ExtensionLazyListener(browser, [
  {
    namespace: 'runtime',
    eventNames: ['onMessage'], // allowed, even though it allows non-void return type
  },
  {
    namespace: 'urlbar',
    // @ts-expect-error - onResultsRequested requires a non-void return type, so it shouldn't be allowed here
    eventNames: ['onResultsRequested'],
  },
]);
// this should work, because `onMessage` DOES allow for a `void` return type.
// It should actually  _require_ a void return type though.
a.addListener('runtime', 'onMessage', (_message: unknown): void => {
  // returns `void`, which is correct
});
// @ts-expect-error - this should never work, as `onMessage` does not allow returning `boolean`
// so it must not be permitted here.
a.addListener('runtime', 'onMessage', (_message: unknown): boolean => {
  // browser.runtime.onMessage does allow returning `true`, but that won't work
  // in a lazy env, so we can't allow it here.
  return true;
});
a.addListener(
  'urlbar',
  // @ts-expect-error - this should never work, as `onResultsRequested` requires a
  // non-void return type, so it must not be permitted here.
  'onResultsRequested',
  (_message: unknown): Urlbar.Result[] => {
    // this is a valid return type for urlbar.onResultsRequested, but
    // we shouldn't allow it here, because it would lead to bugs in a lazy env.
    return {} as Urlbar.Result[];
  },
);
