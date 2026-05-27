import { NamespacedName } from '@metamask/messenger';
import { Json } from '@metamask/utils';
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

/**
 * Sets/replaces the background connection reference.
 *
 * @param backgroundConnection
 */
export async function setBackgroundConnection(
  backgroundConnection: BackgroundRpcClient,
) {
  background = backgroundConnection;
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
 * The deduplication is implemented on the background client itself; this
 * function is a thin wrapper that frames the call as a messenger subscription.
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
  return background.subscribe<Data>({
    subscribeRequest: {
      method: 'messengerSubscribe',
      params: [event],
    },
    unsubscribeRequest: {
      method: 'messengerUnsubscribe',
      params: [event],
    },
    notificationMethod: MESSENGER_SUBSCRIPTION_NOTIFICATION,
    callback,
  });
}
