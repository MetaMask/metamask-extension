import browser from 'webextension-polyfill';
import type { Browser, Events } from 'webextension-polyfill';
import type {
  BrowserEventName,
  BrowserNamespace,
  CallbackArguments,
  EventKeys,
} from './extension-lazy-listener.types';

// Create a type that maps BrowserNamespace to its event names
type NamespaceEvents = {
  [K in keyof Browser]: EventKeys<Browser[K]> extends never
    ? never
    : {
        namespace: K;
        eventNames: {
          [P in keyof Browser[K]]: Browser[K][P] extends Events.Event<any>
            ? P
            : never;
        }[keyof Browser[K]][];
      };
}[keyof Browser][];

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
  ): ExtensionLazyListener['namespaceListeners'];
};

function getEvent<
  Namespace extends BrowserNamespace,
  EventName extends BrowserEventName<Namespace>,
>(namespace: Namespace, eventName: EventName) {
  const event = browser[namespace][eventName];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return event as typeof event & Events.Event<any>;
}

export class ExtensionLazyListener {
  private namespaceListeners: NamespaceListenerMap = new Map();

  constructor(events: NamespaceEvents = []) {
    for (const { namespace, eventNames } of events) {
      this.#startListening({
        namespace,
        eventNames: eventNames as BrowserEventName<typeof namespace>[],
      });
    }
  }

  #startListening<
    Namespace extends BrowserNamespace,
    EventNames extends BrowserEventName<Namespace>[],
  >({
    namespace,
    eventNames,
  }: {
    namespace: Namespace;
    eventNames: EventNames;
  }) {
    let listeners = this.namespaceListeners.get(namespace);
    if (!listeners) {
      listeners = new Map();
      this.namespaceListeners.set(namespace, listeners);
    }
    for (const eventName of eventNames) {
      type Arguments = CallbackArguments<Namespace>;
      const calls: Arguments[] = [];
      const listener = (...args: Arguments) => {
        calls.push(args);
      };
      const event = getEvent(namespace, eventName);
      if ('addListener' in event) {
        event.addListener(listener);
      }
      listeners.set(eventName, { listener, calls });
    }
  }

  public addListener<
    Namespace extends BrowserNamespace,
    EventName extends BrowserEventName<Namespace>,
  >(
    namespace: Namespace,
    eventName: EventName,
    callback: (...args: CallbackArguments<Namespace, EventName>) => void,
  ) {
    const event = getEvent(namespace, eventName);
    event.addListener(callback);
    const trackers = this.namespaceListeners.get(namespace);
    if (trackers) {
      const tracker = trackers.get(eventName);
      if (tracker) {
        trackers.delete(eventName);
        event.removeListener(tracker.listener);
        setImmediate(() => {
          tracker.calls.forEach((args) =>
            callback(...(args as CallbackArguments<Namespace, EventName>)),
          );
        });
      }
    }
  }

  public once<
    Namespace extends BrowserNamespace,
    EventName extends BrowserEventName<Namespace>,
  >(namespace: Namespace, eventName: EventName) {
    return new Promise<CallbackArguments<Namespace, EventName>>((resolve) => {
      const event = getEvent(namespace, eventName);
      function listener(...args: CallbackArguments<Namespace, EventName>) {
        event.removeListener(listener);
        resolve(args);
      }
      const trackers = this.namespaceListeners.get(namespace);
      if (trackers) {
        const tracker = trackers.get(eventName);
        if (tracker?.calls.length) {
          // Use setImmediate to ensure the promise resolves asynchronously
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
            // if the tracker has no more calls, we can remove it
            trackers.delete(eventName);
          }
          return;
        }
      }

      event.addListener(listener);
    });
  }
}
