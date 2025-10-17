/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Browser, Events, Urlbar } from 'webextension-polyfill';
import type {} from './extension-lazy-listener.types';

type BrowserEventName<Browser, Namespace extends keyof Browser> = Extract<
  {
    [E in keyof Browser[Namespace]]: Browser[Namespace][E] extends Events.Event<
      infer Callback
    >
      ? Callback extends (...args: any[]) => infer R
        ? R extends void // or `void | boolean` if you prefer
          ? E
          : never
        : never
      : never;
  }[keyof Browser[Namespace]],
  string
>;

type BrowserNamespace<Browser> = Extract<
  {
    [K in keyof Browser]: {
      [E in keyof Browser[K]]: Browser[K][E] extends Events.Event<
        infer Callback
      >
        ? Callback extends (...args: any[]) => infer R
          ? R extends void // or `void | boolean`
            ? K
            : never
          : never
        : never;
    }[keyof Browser[K]];
  }[keyof Browser],
  string
>;

type EventCallback<
  BrowserType,
  Namespace extends keyof BrowserType,
  EventName extends keyof BrowserType[Namespace],
> =
  BrowserType[Namespace][EventName] extends Events.Event<infer Callback>
    ? Callback
    : never;

// Options as a dictionary keyed by *only* valid namespaces
type Options<Browser> = {
  [K in BrowserNamespace<Browser>]?: BrowserEventName<Browser, K>[];
};

interface TestType {
  thing0: {
    thing0: {
      something: string;
    };
  };
  thing1: {
    thing1A: Events.Event<(...args: any[]) => void>;
    thing1B: Events.Event<(...args: any[]) => true | void>;
  };
  thing2: {
    thing21: Events.Event<(...args: any[]) => true>;
    thing2B: Events.Event<(...args: any[]) => false>;
  };
}

function main() {
  const Test = new ExtensionLazyListener({} as TestType);
}

type Args = unknown[];
type Listener = (...args: Args) => void;

interface BrowserInterface {}

function typedEntries<T extends object>(obj: T) {
  return Object.entries(obj) as {
    [K in keyof T]: [K, Exclude<T[K], undefined>];
  }[keyof T][];
}

/**
 * A utility to lazily listen to browser extension events, buffering calls until
 * a real listener is added.
 */
export class ExtensionLazyListener<
  BrowserType extends BrowserInterface = Browser,
> {
  #browser: BrowserType;

  #namespaceListeners: Map<
    string,
    Map<
      string,
      {
        listener: Listener;
        calls: Args[];
      }
    >
  > = new Map();

  /**
   * Creates an instance of ExtensionLazyListener.
   *
   * @param browser - The browser namespace, e.g., 'runtime', 'tabs', etc.
   * @param events - The events to listen to, specified as an array of namespace and event name pairs.
   * @param timeout - The time in milliseconds to wait before warning about potential memory leaks. Default is 20000ms (20 seconds).
   */
  constructor(
    browser: BrowserType,
    events: Options<BrowserType> = {},
    timeout = 20000,
  ) {
    this.#browser = browser;

    for (const [namespace, eventNames] of typedEntries(events)) {
      let listeners = this.#namespaceListeners.get(namespace);
      if (!listeners) {
        listeners = new Map();
        this.#namespaceListeners.set(namespace, listeners);
      }

      for (const eventName of eventNames) {
        const calls: Args[] = [];
        const listener = (...args: Args): void => {
          calls.push(args);
        };
        this.#getEvent(namespace, eventName).addListener(listener);
        listeners.set(eventName, { listener, calls });
      }
    }

    setTimeout(() => {
      // if there are still listeners after `timeout` ms, it means
      // we have a memory leak. Lets warn in the console and give developers
      // clear instructions on how to investigate why this has happened.
      for (const [namespace, listeners] of this.#namespaceListeners) {
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
  #getEvent(namespace: string, eventName: string) {
    // @ts-expect-error - TODO: fix these types
    const event = this.#browser[namespace][eventName];
    // Cast to an Event whose callback parameters match the coerced CallbackArguments for this event.
    return event as Events.Event<(...args: unknown[]) => void>;
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
    Namespace extends BrowserNamespace<BrowserType>,
    EventName extends BrowserEventName<BrowserType, Namespace>,
    Callback extends EventCallback<BrowserType, Namespace, EventName>,
  >(namespace: Namespace, eventName: EventName, callback: Callback) {
    const event = this.#getEvent(namespace, eventName);
    // take over from any lazy listeners
    event.addListener(callback);

    const trackers = this.#namespaceListeners.get(namespace);
    if (trackers) {
      const tracker = trackers.get(eventName);
      if (tracker) {
        // we have a listener from the application, so we must:
        // 1. stop the lazy listener
        // 2. flush any buffered calls

        // 1. stop the lazy listener
        event.removeListener(tracker.listener);
        trackers.delete(eventName);
        setImmediate(() => {
          // 2. flush any buffered calls
          while (tracker.calls.length && event.hasListener(callback)) {
            const args = tracker.calls.shift() as Args;
            callback(...args);
          }
          // if the `tracker.calls` queue still has calls, we need to keep the
          // tracker around so they can be consumed later, so we add it back here.
          if (tracker.calls.length !== 0) {
            trackers.set(eventName, tracker);
          }
        });
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
    Namespace extends BrowserNamespace<BrowserType>,
    EventName extends BrowserEventName<BrowserType, Namespace>,
  >(namespace: Namespace, eventName: EventName) {
    return new Promise<Args>((resolve) => {
      const event = this.#getEvent(namespace, eventName);
      const listeners = this.#namespaceListeners.get(namespace);
      if (listeners) {
        const tracker = listeners.get(eventName);
        if (tracker?.calls.length) {
          // Use setImmediate to ensure the Promise resolves asynchronously
          // just like it would if the event were emitted "naturally" after
          // calling `once(...)`
          const nextArgs = tracker.calls.shift() as Args;
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
      const tempListener = (...args: Args) => {
        event.removeListener(tempListener);
        resolve(args);
      };
      event.addListener(tempListener);
    });
  }
}

// Examples of problematic namespaces/events:

// runtime.onMessage allows for a non-void return type
declare const browser: Browser;
const a = new ExtensionLazyListener(browser, {
  runtime: ['onMessage'], // allowed, even though it allows non-void return type
  // @ts-expect-error - not valid return type
  urlbar: ['onResultsRequested'],
});

// this should work, because `onMessage` DOES allow for a `void` return type.
// It should actually  _require_ a void return type though.
a.addListener('runtime', 'onMessage', (_message: unknown): void => {
  // returns `void`, which is correct
});
// @ts-expect-error - this should never work, as `onMessage` *does* allow
// returning `true`, but that won't work in a lazy way, so we don't allow it.
a.addListener('runtime', 'onMessage', (_message: unknown): boolean => {
  return true;
});

a.addListener(
  'urlbar',
  // @ts-expect-error - this should never work, as `onResultsRequested` does allow
  // returning `Urlbar.Result[]`, but that won't work in a lazy way, so we don't allow it.
  'onResultsRequested',
  (_message: unknown): Urlbar.Result[] => {
    return {} as Urlbar.Result[];
  },
);
// @ts-expect-error - this should never work, as `onResultsRequested` does not
// allow returning `void`, but that won't work in a lazy way, so we don't allow it.
a.addListener('urlbar', 'onResultsRequested', (_message: unknown): void => {
  return;
});

// @ts-expect-error - `onResultsRequested` is allowed _at all_, since no valid
// callback types return `void` (which is all we allow).
a.addListener('urlbar', 'onResultsRequested', {} as any);
