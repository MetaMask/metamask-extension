// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import type { Api } from '../../app/scripts/metamask-controller';

type CallbackMethod<R = unknown> = (error?: unknown, result?: R) => void;

let background: Api;

export const generateActionId = () => Date.now() + Math.random();

/**
 * Calls a method on the background connection.
 *
 * @param method - name of the background method
 * @param args - arguments to that method, if any
 * @returns
 */
export function submitRequestToBackground<
  Method extends keyof Api,
  Args extends Parameters<Api[Method]>,
>(method: Method, args: Args) {
  return Reflect.apply(background[method], background, args);
}

/**
 * [Deprecated] Callback-style call to background method.
 *
 * @deprecated Use async `submitRequestToBackground` function instead.
 * @param method - name of the background method
 * @param [args] - arguments to that method, if any
 * @param callback - Node style (error, result) callback for finishing the operation
 */
export function callBackgroundMethod<
  Method extends keyof Api,
  Args extends Parameters<Api[Method]>,
>(
  method: Method,
  args: Args,
  callback: CallbackMethod<Awaited<ReturnType<Api[Method]>>>,
) {
  submitRequestToBackground(method, args).then(
    (result) => {
      callback(undefined, result);
    },
    (error) => {
      callback(error);
    },
  );
}

/**
 * Sets or replaces the background connection reference.
 *
 * @param backgroundConnection - the new background connection
 */
export async function setBackgroundConnection(backgroundConnection: Api) {
  background = backgroundConnection;
}
