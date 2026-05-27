import { NamespacedName } from '@metamask/messenger';
import { Json, JsonRpcNotification } from '@metamask/utils';
// eslint-disable-next-line import-x/no-restricted-paths
import { type MetaRpcClientFactory } from '../../app/scripts/lib/metaRPCClientFactory';
import { MESSENGER_SUBSCRIPTION_NOTIFICATION } from '../../shared/constants/messages';
import { getSerializedTraceContext } from '../../shared/lib/trace';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Api = Record<string, (...params: any[]) => any>;
type BackgroundRpcClient = MetaRpcClientFactory<Api>;

const NO_BACKGROUND_CONNECTION_MESSAGE =
  'Background connection is not set. Please initialize the background connection before making requests.';

let background: BackgroundRpcClient;

export const generateActionId = () => Date.now() + Math.random();

/**
 * Promise-style call to background method invokes promisifiedBackground method directly.
 * Automatically propagates the active Sentry trace context to the background
 * for distributed tracing across the UI/background boundary.
 *
 * @param method - name of the background method
 * @param [args] - arguments to that method, if any
 * @returns
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function submitRequestToBackground<R>(
  method: keyof Api,
  args?: Parameters<Api[typeof method]>,
): Promise<R> {
  if (process.env.IN_TEST) {
    // tests don't always set the `background` property for convenience, as
    // the return values for various RPC calls aren't always used. In production
    // builds, this will not happen, and even if it did MM wouldn't work.
    if (!background) {
      console.warn(NO_BACKGROUND_CONNECTION_MESSAGE);
      return Promise.resolve() as Promise<R>;
    }
  }

  const traceContext = getSerializedTraceContext();
  const rpcArgs = traceContext
    ? // eslint-disable-next-line @typescript-eslint/naming-convention
      [...(args ?? []), { _traceContext: traceContext }]
    : (args ?? []);

  return background[method](...rpcArgs) as unknown as Promise<R>;
}

type EventEntry = {
  // Callbacks are identified by reference. Subscribing the same function twice
  // to the same event collapses to a single entry, and the first matching
  // unsubscribe removes it for both callers — mirrors `Set` semantics.
  callbacks: Set<(data: Json) => void>;
  subscribePromise: Promise<void>;
};

const eventEntries = new Map<NamespacedName, EventEntry>();
// Tracks whether the router is attached to the *current* `background`
// reference. `setBackgroundConnection` resets it to false because the
// previous connection's listener is unreachable from the new connection.
let notificationRouterAttached = false;

function notificationRouter(notification: JsonRpcNotification<[string, Json]>) {
  if (notification.method !== MESSENGER_SUBSCRIPTION_NOTIFICATION) {
    return;
  }
  const { params } = notification;
  if (!params) {
    return;
  }
  const [eventName, payload] = params;
  // `eventName` is `string` from the notification params; mismatches are caught by the entry-not-found check below.
  const entry = eventEntries.get(eventName as NamespacedName);
  if (!entry) {
    return;
  }
  for (const callback of entry.callbacks) {
    try {
      callback(payload);
    } catch (error) {
      console.error(error);
    }
  }
}

/**
 * Sets/replaces the background connection reference.
 *
 * Clears any in-memory subscription state because subscriptions registered
 * against the previous background connection are stale once the connection
 * has been replaced.
 *
 * @param backgroundConnection
 */
export async function setBackgroundConnection(
  backgroundConnection: BackgroundRpcClient,
) {
  background = backgroundConnection;
  eventEntries.clear();
  notificationRouterAttached = false;
}

/**
 * Subscribe to a given messenger event emitted by the background.
 *
 * Subscriptions are deduplicated by event name: multiple local subscribers to
 * the same event share a single upstream `messengerSubscribe` IPC and a single
 * `background.onNotification` listener. The upstream `messengerUnsubscribe` IPC
 * is only sent when the last local subscriber to an event unsubscribes.
 *
 * Callbacks are identified by reference: subscribing the same function object
 * twice to the same event collapses to a single slot, and the first
 * unsubscribe removes it for both callers.
 *
 * @param event - The event name.
 * @param callback - The callback to invoke when the event is emitted.
 * @returns A cleanup function that can be invoked to unsubscribe.
 */
export async function subscribeToMessengerEvent<Data extends Json>(
  event: NamespacedName,
  callback: (data: Data) => void,
): Promise<() => Promise<void>> {
  // `Data extends Json` but `(data: Data) => void` is not assignable to `(data: Json) => void` due to contravariant function parameters; the cast is safe because all callbacks receive `Json`-shaped data at runtime.
  const looselyTypedCallback = callback as (data: Json) => void;

  let entry = eventEntries.get(event);

  if (entry) {
    entry.callbacks.add(looselyTypedCallback);
  } else {
    if (!notificationRouterAttached) {
      background.onNotification(notificationRouter);
      notificationRouterAttached = true;
    }

    const subscribePromise = submitRequestToBackground<void>(
      'messengerSubscribe',
      [event],
    );

    entry = {
      callbacks: new Set([looselyTypedCallback]),
      subscribePromise,
    };
    eventEntries.set(event, entry);

    // Side-effect handler: clear the entry on rejection so future subscribe
    // attempts retry cleanly. Do NOT reassign `entry.subscribePromise` here —
    // the original promise must retain its rejection so awaiters below still
    // see it.
    subscribePromise.catch(() => {
      eventEntries.delete(event);
    });
  }

  await entry.subscribePromise;

  return async () => {
    const currentEntry = eventEntries.get(event);
    if (!currentEntry) {
      return;
    }

    const removed = currentEntry.callbacks.delete(looselyTypedCallback);
    if (!removed || currentEntry.callbacks.size > 0) {
      return;
    }

    eventEntries.delete(event);
    await submitRequestToBackground('messengerUnsubscribe', [event]);
  };
}
