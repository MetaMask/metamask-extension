import pify from 'pify';

let background:
  | ({
      connectionStream: { readable: boolean };
      DisconnectError: typeof Error;
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } & Record<string, (...args: any[]) => any>)
  | null = null;
let promisifiedBackground: Record<
  string,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...args: any[]) => Promise<any>
> | null = null;

export const generateActionId = () => Date.now() + Math.random();

/**
 * Promise-style call to background method invokes promisifiedBackground method directly.
 *
 * @param method - name of the background method
 * @param [args] - arguments to that method, if any
 * @returns
 */
export function submitRequestToBackground<R>(
  method: string,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any[],
): Promise<R> {
  return promisifiedBackground?.[method](
    ...(args ?? []),
  ) as unknown as Promise<R>;
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
  method: string,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[],
  callback: CallbackMethod<R>,
) => {
  background?.[method](...args, callback);
};

/**
 * Sets/replaces the background connection reference
 * Under MV3 it also triggers queue processing if the new background is connected
 *
 * @param backgroundConnection
 */
export async function setBackgroundConnection(
  backgroundConnection: typeof background,
) {
  background = backgroundConnection;
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  promisifiedBackground = pify(background as Record<string, any>);
}
