// eslint-disable-next-line import/no-restricted-paths
import { type MetaRpcClientFactory } from '../../app/scripts/lib/metaRPCClientFactory';

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
 *
 * @param method - name of the background method
 * @param [args] - arguments to that method, if any
 * @returns
 */
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
  return background[method](...(args ?? [])) as unknown as Promise<R>;
}

type CallbackMethod<R = unknown> = (error?: unknown, result?: R) => void;

/**
 * [Deprecated] Callback-style call to background method
 * invokes promisifiedBackground method directly.
 *
 * @deprecated Use async `submitRequestToBackground` function instead.
 * @param method - name of the background method
 * @param [args] - arguments to that method, if any
 * @param callback - Node style (error, result) callback for finishing the operation
 */
export const callBackgroundMethod = <R>(
  method: keyof Api,

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Parameters<Api[typeof method]>,
  callback: CallbackMethod<R>,
) => {
  submitRequestToBackground<R>(method, args).then(
    (result) => callback(null, result),
    callback,
  );
};

/**
 * Sets/replaces the background connection reference
 *
 * @param backgroundConnection
 */
export async function setBackgroundConnection(
  backgroundConnection: BackgroundRpcClient,
) {
  background = backgroundConnection;
}
