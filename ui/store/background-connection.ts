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

type MessengerEventSubscription = {
  // Each subscribe call is an independent registration keyed by a unique
  // symbol, so unsubscribing one never affects another even when they share
  // the same callback reference.
  callbacks: Map<symbol, (data: Json) => void>;
  subscribePromise: Promise<void>;
};

const messengerEventSubscriptions = new Map<
  NamespacedName,
  MessengerEventSubscription
>();
// Tracks whether the router is attached to the current background reference.
// setBackgroundConnection resets it so the router reattaches to the new
// connection on the next subscribe.
let notificationRouterAttached = false;

function routeMessengerEventNotification(
  notification: JsonRpcNotification<[string, Json]>,
) {
  if (
    notification.method !== MESSENGER_SUBSCRIPTION_NOTIFICATION ||
    !notification.params
  ) {
    return;
  }
  const [eventName, payload] = notification.params;
  // `eventName` is `string` from the notification params; mismatches are caught by the entry-not-found check below.
  const subscription = messengerEventSubscriptions.get(
    eventName as NamespacedName,
  );
  if (!subscription) {
    return;
  }
  for (const callback of subscription.callbacks.values()) {
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
  messengerEventSubscriptions.clear();
  notificationRouterAttached = false;
}

/**
 * Subscribe to a given event emitted by the background via the root messenger.
 *
 * Because callbacks cannot be sent to the background, we create the
 * subscription in two steps:
 *
 * 1. First, we send a `messengerSubscribe` request to the background, which
 * will attach an event listener to the root messenger. When the event occurs,
 * it will send a notification.
 * 2. Second, we use `onNotification` on the background client to wait for the
 * notification. When it arrives, it will call the given callback.
 *
 * To prevent unnecessary calls to the background, if this function is called
 * more than once for the same pending event, callbacks will be consolidated;
 * when the event occurs, they will be called in the order they were defined.
 *
 * @param event - The event name.
 * @param callback - The callback to invoke when the event is emitted.
 * @returns A cleanup function that can be invoked to remove the subscription on
 * the messenger event. If multiple subscriptions exist for the same messenger
 * event, the unsubscribe function will only take effect once there is only one
 * subscriber left.
 */
export async function subscribeToMessengerEvent<Data extends Json>(
  event: NamespacedName,
  callback: (data: Data) => void,
): Promise<() => Promise<void>> {
  // `Data extends Json` but `(data: Data) => void` is not assignable to `(data: Json) => void` due to contravariant function parameters; the cast is safe because all callbacks receive `Json`-shaped data at runtime.
  const looselyTypedCallback = callback as (data: Json) => void;

  // Unique key for this registration so it can be removed independently of any
  // other registration that happens to share the same callback reference.
  const registrationId = Symbol('messengerEventSubscription');

  let subscription = messengerEventSubscriptions.get(event);

  if (subscription) {
    subscription.callbacks.set(registrationId, looselyTypedCallback);
  } else {
    if (!notificationRouterAttached) {
      background.onNotification(routeMessengerEventNotification);
      notificationRouterAttached = true;
    }

    const subscribePromise = submitRequestToBackground<void>(
      'messengerSubscribe',
      [event],
    );

    subscription = {
      callbacks: new Map([[registrationId, looselyTypedCallback]]),
      subscribePromise,
    };
    messengerEventSubscriptions.set(event, subscription);

    // Side-effect handler: clear the entry on rejection so future subscribe
    // attempts retry cleanly. Do NOT reassign `subscription.subscribePromise`
    // here — the original promise must retain its rejection so awaiters below
    // still see it.
    subscribePromise.catch(() => {
      messengerEventSubscriptions.delete(event);
    });
  }

  await subscription.subscribePromise;

  return async () => {
    const currentSubscription = messengerEventSubscriptions.get(event);
    if (!currentSubscription) {
      return;
    }

    const removed = currentSubscription.callbacks.delete(registrationId);
    if (!removed || currentSubscription.callbacks.size > 0) {
      return;
    }

    messengerEventSubscriptions.delete(event);
    await submitRequestToBackground('messengerUnsubscribe', [event]);
  };
}
