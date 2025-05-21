// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import type { MetaRpcClientFactory } from '../../app/scripts/lib/metaRPCClientFactory';

let background: MetaRpcClientFactory | null = null;

export const generateActionId = () => Date.now() + Math.random();

/**
 * Calls a method on the background connection.
 *
 * @param method - name of the background method
 * @param args - arguments to that method, if any
 * @returns
 */
export function submitRequestToBackground<R>(
  method: string,
  args: unknown[],
): Promise<R> {
  return background?.[method](...args) as Promise<R>;
}

type CallbackMethod<R = unknown> = (error?: unknown, result?: R) => void;

/**
 * [Deprecated] Callback-style call to background method.
 *
 * @deprecated Use async `submitRequestToBackground` function instead.
 * @param method - name of the background method
 * @param args - arguments to that method, if any
 * @param callback - Node style (error, result) callback for finishing the operation
 */
export const callBackgroundMethod = <Result>(
  method: string,
  args: unknown[],
  callback: CallbackMethod<Result>,
) => {
  background?.[method](...args).then(
    (result) => {
      callback(undefined, result as Result);
    },
    (error) => {
      callback(error);
    },
  );
};

/**
 * Sets or replaces the background connection reference.
 *
 * @param backgroundConnection - the new background connection
 */
export async function setBackgroundConnection(
  backgroundConnection: MetaRpcClientFactory,
) {
  background = backgroundConnection;
}
