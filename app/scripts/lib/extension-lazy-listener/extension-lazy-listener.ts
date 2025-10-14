import browser from 'webextension-polyfill';
import type { Browser, Events } from 'webextension-polyfill';
import type {
  BrowserEventName,
  BrowserNamespace,
  CallbackArguments,
  EventKeys,
} from './extension-lazy-listener.types';

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
    // iterator over the entries of the events object
    events.forEach((event) =>
      this._install(
        event as {
          namespace: typeof event.namespace;
          eventNames: BrowserEventName<typeof event.namespace>[];
        },
      ),
    );
  }

  private _install<
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
    (getEvent as any)(namespace, eventName).addListener(callback);
    const trackers = this.namespaceListeners.get(namespace);
    if (trackers) {
      const tracker = trackers.get(eventName);
      if (tracker) {
        trackers.delete(eventName);
        (getEvent as any)(namespace, eventName).removeListener(
          tracker.listener,
        );
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
      const event = (getEvent as any)(namespace, eventName);
      function listener(...args: CallbackArguments<Namespace, EventName>) {
        event.removeListener(listener);
        resolve(args);
      }
      const trackers = this.namespaceListeners.get(namespace);
      if (trackers) {
        const tracker = trackers.get(eventName);
        if (tracker && tracker.calls.length > 0) {
          const args = tracker.calls.shift();
          setImmediate(() => {
            resolve((args || []) as CallbackArguments<Namespace, EventName>);
          });
          if ('removeListener' in event) {
            event.removeListener(tracker.listener);
          }
        } else {
          event.addListener(listener);
        }
      } else {
        event.addListener(listener);
      }
    });
  }
}

// Create a type that maps BrowserNamespace to its event names
export type NamespaceEvents = {
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
