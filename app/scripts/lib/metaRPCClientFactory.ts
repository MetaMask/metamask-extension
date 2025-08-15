import type { Duplex } from 'stream';
import SafeEventEmitter from '@metamask/safe-event-emitter';
import {
  Json,
  JsonRpcFailure,
  JsonRpcRequest,
  JsonRpcNotification,
  isObject,
  hasProperty,
} from '@metamask/utils';
import { JsonRpcError } from '@metamask/rpc-errors';
import { TEN_SECONDS_IN_MILLISECONDS } from '../../../shared/lib/transactions-controller-utils';
import getNextId from '../../../shared/modules/random-id';
// It *is* used: in TypeDoc comment, you silly goose.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type MetamaskController from '../metamask-controller';

const JSON_RPC_VERSION = '2.0' as const;

type Timer = ReturnType<typeof setTimeout>;

/**
 * A JSON-RPC 2.0 request object, types with our request types.
 */
type JsonRpcApiRequest<Api extends FunctionRegistry<Api>> = {
  jsonrpc: typeof JSON_RPC_VERSION;
  id: number;
  method: Extract<keyof Api, string>;
  params: Parameters<Api[keyof Api]>;
};

/**
 * A JSON-RPC 2.0 response object, typed with our response types.
 */
type JsonRpcApiResponse<Api extends FunctionRegistry<Api>> = {
  jsonrpc: typeof JSON_RPC_VERSION;
  id: number;
  result: Awaited<ReturnType<Api[keyof Api]>>;
};

/**
 * The shape for the object that provides our list of functions that can be
 * called on the RPC client.
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type FunctionRegistry<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? A extends Json[] // every param must be Json
      ? R extends Json | void | Promise<Json | void> // return must be Json
        ? T[K] // OK
        : never // bad return
      : never // bad params
    : never; // not even a function
};

/**
 * Api methods, promisified. All RPC methods are remote and have to be handled
 * asynchronously, so we wrap the return types in a Promise.
 */
type PromisifiedApi<Api extends FunctionRegistry<Api>> = {
  [K in keyof Api]: (
    ...args: Parameters<Api[K]>
  ) => Promise<ReturnType<Api[K]>>;
};

/**
 * Checks if the given data is a JsonRpcFailure.
 *
 * @param data - The data to check.
 * @returns True if the data is a JsonRpcFailure, false otherwise.
 */
function isError<Api extends FunctionRegistry<Api>>(
  data: JsonRpcApiResponse<Api> | JsonRpcRequest | JsonRpcFailure,
): data is JsonRpcFailure {
  return hasProperty(data, 'error');
}

/**
 * Type guard for checking if a property is in an object. Differs from
 * {@link hasProperty} in that it checks the prototype chain and the type guard
 * checks the property, not the object.
 *
 * @param property - The property to check.
 * @param obj - The object to check.
 * @returns True if the property is in the object, false otherwise.
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function propertyIn<T extends object>(
  property: PropertyKey,
  obj: T,
): property is keyof T {
  return Reflect.has(obj, property);
}

export class DisconnectError extends Error {}

/**
 * A JSON-RPC 2.0 client that communicates over a stream.
 */
export class MetaRPCClient<Api extends FunctionRegistry<Api>> {
  #rpcCache = new Map<
    Extract<keyof Api, string>,
    PromisifiedApi<Api>[Extract<keyof Api, string>]
  >();

  /**
   * The stream used to communicate with the server.
   */
  readonly #connectionStream: Duplex;

  readonly #notificationChannel = new SafeEventEmitter();

  readonly #uncaughtErrorChannel = new SafeEventEmitter();

  /**
   * A map of requests that are currently pending.
   */
  readonly requests = new Map<
    number,
    {
      resolve: (value: Awaited<ReturnType<Api[keyof Api]>>) => void;
      reject: (error: Error) => void;
      timer?: Timer;
    }
  >();

  /**
   * Creates a new MetaRPCClient instance.
   *
   * @param connectionStream - The stream to use for the RPC client.
   */
  constructor(connectionStream: Duplex) {
    this.#connectionStream = connectionStream
      .on('data', this.handleResponse)
      .on('end', this.close);
  }

  /**
   * Gets a resolver function for the specified method.
   *
   * @returns A function that resolves the method on the client.
   */
  getRpcResolver = () => {
    type MethodName = Extract<keyof Api, string>;
    return (
      client: typeof this,
      method: keyof typeof this | MethodName,
      receiver: unknown,
    ) => {
      if (propertyIn(method, client)) {
        // Return any properties present on `MetaRPCClient`
        return Reflect.get(client, method, receiver);
      }

      const cachedRpc = this.#rpcCache.get(method);
      if (cachedRpc) {
        return cachedRpc;
      }
      const rpc = async (...params: Parameters<Api[MethodName]>) =>
        await client.send({
          id: getNextId(),
          jsonrpc: JSON_RPC_VERSION,
          method,
          params,
        });
      // Cache the method to avoid creating it again
      this.#rpcCache.set(method, rpc);
      return rpc;
    };
  };

  /**
   * Sends a JSON-RPC request over the connection stream and returns a promise
   * that resolves to the result of the method call.
   *
   * @param payload - The payload to send.
   * @returns A promise that resolves to the result of the method call.
   */
  async send(payload: JsonRpcApiRequest<Api>) {
    return new Promise<Awaited<ReturnType<Api[typeof payload.method]>>>(
      (resolve, reject) => {
        let timer: Timer | undefined;
        if (payload.method === 'getState') {
          timer = setTimeout(() => {
            this.requests.delete(payload.id);
            reject(new Error('No response from RPC'));
          }, TEN_SECONDS_IN_MILLISECONDS);
        }
        this.requests.set(payload.id, { resolve, reject, timer });
        this.#connectionStream.write(payload);
      },
    );
  }

  /**
   * Sets up a listener for JSON-RPC notifications.
   *
   * @param handler - The handler to call when a notification is received.
   */
  onNotification = (handler: (data: JsonRpcNotification) => void) => {
    this.#notificationChannel.addListener('notification', handler);
  };

  /**
   * Sets up a listener for uncaught errors.
   *
   * @param handler - The handler to call when an error is received.
   */
  onUncaughtError = (
    handler: (error: JsonRpcError<Json | undefined>) => void,
  ) => {
    this.#uncaughtErrorChannel.addListener('error', handler);
  };

  /**
   * Closes the connection and cleans up.
   *
   * @param reason
   */
  close = (reason: string = 'disconnected') => {
    // stop processing the stream
    this.#connectionStream.off('data', this.handleResponse);
    this.#connectionStream.off('end', this.close);

    // fail all unfinished requests
    this.requests.forEach(({ reject, timer }) => {
      clearTimeout(timer);
      reject(new DisconnectError(reason));
    });
    this.requests.clear();

    // remove all external listeners
    this.#notificationChannel.removeAllListeners();
    this.#uncaughtErrorChannel.removeAllListeners();
  };

  /**
   * Handles a JSON-RPC response.
   *
   * @param response - The response to handle.
   */
  handleResponse = (
    response: JsonRpcApiResponse<Api> | JsonRpcRequest | JsonRpcNotification,
  ) => {
    if (
      !isObject(response) ||
      !hasProperty(response, 'jsonrpc') ||
      response.jsonrpc !== JSON_RPC_VERSION
    ) {
      // ignore noise which can cause processing errors
      return;
    }

    if (hasProperty(response, 'method')) {
      if (!hasProperty(response, 'id')) {
        // react to server-side to client-side notifications.
        // A JSON-RPC notification is a request without an `id`.
        this.#notificationChannel.emit('notification', response);
      }
      // ignore server-side to client side *requests* (messages with an `id` and
      // a `method`).
      return;
    }

    const { id } = response;
    const { requests } = this;
    const request = requests.get(id);

    if (isError(response)) {
      const { error } = response;
      const { code, message, data, stack } = error;
      const e = new JsonRpcError(code, message, data);
      // preserve the stack
      e.stack = stack;
      if (request) {
        requests.delete(id);
        clearTimeout(request.timer);
        request.reject(e);
      } else {
        this.#uncaughtErrorChannel.emit('error', e);
      }
    } else if (request) {
      requests.delete(id);
      clearTimeout(request.timer);
      request.resolve(response.result);
    }
  };
}

export type MetaRpcClientFactory<Api extends FunctionRegistry<Api>> =
  MetaRPCClient<Api> & PromisifiedApi<Api>;

/**
 * Creates a `MetaRPCClient` instance that also proxies requests/responses to
 * the background process over the provided `connectionStream`. It listens to
 * the stream bi-directionally, allowing it to send requests and receive
 * both responses and unsolicited notifications.
 *
 * It can parse JSON-RPC 2.0 requests and responses.
 *
 * In practice, this is used to send messages to from the UI to the background's
 * API methods configured within {@link MetamaskController}.
 *
 * @template Api - The type of the methods available on the MetaRPCClient.
 * @param connectionStream - The connection stream to use for the RPC client.
 * @returns An API that blends methods of our `MetaRPCClient` and an RPC service
 * that communicates over the provided `connectionStream` in order to remote
 * invoke methods available over the provided `Api` template type.
 */
export default function metaRPCClientFactory<Api extends FunctionRegistry<Api>>(
  connectionStream: Duplex,
) {
  const metaRPCClient = new MetaRPCClient<Api>(connectionStream);
  return new Proxy(metaRPCClient, {
    get: metaRPCClient.getRpcResolver(),
  }) as MetaRpcClientFactory<Api>;
}
