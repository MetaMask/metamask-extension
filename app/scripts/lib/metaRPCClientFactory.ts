import type { Duplex } from 'stream';
import SafeEventEmitter from '@metamask/safe-event-emitter';
import {
  Json,
  JsonRpcFailure,
  JsonRpcRequest,
  JsonRpcResponse,
  hasProperty,
} from '@metamask/utils';
import { JsonRpcError } from '@metamask/rpc-errors';
import { TEN_SECONDS_IN_MILLISECONDS } from '../../../shared/lib/transactions-controller-utils';
import getNextId from '../../../shared/modules/random-id';
// It is used: in TypeDoc comment, you silly goose.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type MetamaskController from '../metamask-controller';

type HashMapFunctions = Record<string, (...args: unknown[]) => unknown>;

export type RpcMethods<RemoteApi extends HashMapFunctions> = {
  [K in keyof RemoteApi]: (
    ...args: Parameters<RemoteApi[K]>
  ) => Promise<Awaited<ReturnType<RemoteApi[K]>>>;
};

class DisconnectError extends Error {}

type RequestId = string | number | null;

export class MetaRPCClient {
  private connectionStream: Duplex;

  private notificationChannel = new SafeEventEmitter();

  private uncaughtErrorChannel = new SafeEventEmitter();

  public readonly requests = new Map<
    RequestId,
    {
      resolve: (result?: unknown) => void;
      reject: (error: Error) => void;
      timeout: number | null;
    }
  >();

  public readonly DisconnectError = DisconnectError;

  constructor(connectionStream: Duplex) {
    this.connectionStream = connectionStream;
    this.connectionStream.on('data', this.handleResponse);
    this.connectionStream.on('end', this.close);
  }

  async send(id: number, payload: JsonRpcRequest) {
    return new Promise((resolve, reject) => {
      let timeout: number | null = null;
      if (payload.method === 'getState') {
        // `window.setTimeout` because typescript thinks the return type is
        // `NodeJS.Timeout` if we use the global `setTimeout` reference.
        timeout = window.setTimeout(() => {
          this.requests.delete(id);
          reject(new Error('No response from RPC'));

          // needed for linter to pass
          return true;
        }, TEN_SECONDS_IN_MILLISECONDS);
      }
      this.requests.set(id, { resolve, reject, timeout });
      this.connectionStream.write(payload);
    });
  }

  onNotification(handler: (data: unknown) => void) {
    this.notificationChannel.addListener('notification', (data) => {
      handler(data);
    });
  }

  onUncaughtError(handler: (error: JsonRpcFailure) => void) {
    this.uncaughtErrorChannel.addListener('error', (error) => {
      handler(error);
    });
  }

  close = () => {
    this.notificationChannel.removeAllListeners();
    this.uncaughtErrorChannel.removeAllListeners();
    this.connectionStream.off('data', this.handleResponse);
    this.connectionStream.off('end', this.close);
    // fail all unfinished requests
    this.requests.forEach((request, id) => {
      const { reject, timeout } = request;
      if (timeout) {
        clearTimeout(timeout);
      }
      this.requests.delete(id);
      reject(new DisconnectError('disconnected'));
    });
    this.requests.clear();
  };

  handleResponse = (data: JsonRpcResponse | JsonRpcRequest) => {
    const { id } = data;
    if (isRequest(data)) {
      const isNotification = id === undefined;
      if (isNotification) {
        // react to server-side to client-side notifications
        this.notificationChannel.emit('notification', data);
      }
      // we ignore server-side to client side _requests_
      return;
    }

    const request = this.requests.get(id);
    if (request) {
      this.requests.delete(id);
      if (request.timeout) {
        clearTimeout(request.timeout);
      }
    }

    if (isError(data)) {
      const { error } = data;
      const e = new JsonRpcError(error.code, error.message, error.data);
      // preserve the stack from serializeError
      e.stack = error.stack;
      if (request) {
        request.reject(e);
      } else {
        this.uncaughtErrorChannel.emit('error', e);
      }
      return;
    }

    if (request) {
      request.resolve(data.result);
    }
  };
}

/**
 * Checks if the given data is a JsonRpcRequest.
 *
 * @param data - The data to check.
 * @returns True if the data is a JsonRpcRequest, false otherwise.
 */
function isRequest(
  data: JsonRpcResponse | JsonRpcRequest,
): data is JsonRpcRequest {
  return hasProperty(data, 'method') && hasProperty(data, 'params');
}

/**
 * Checks if the given data is a JsonRpcFailure.
 *
 * @param data - The data to check.
 * @returns True if the data is a JsonRpcFailure, false otherwise.
 */
function isError(
  data: JsonRpcResponse | JsonRpcRequest,
): data is JsonRpcFailure {
  return hasProperty(data, 'error');
}

/**
 * Checks if an object has a given key, including through its prototype chain.
 *
 * This function acts as a type guard. If it returns `true`, TypeScript will
 * narrow the type of the `key` to be `keyof O`, meaning it's a known key of
 * the object's type.
 *
 * Differs from {@link hasProperty} in that it checks the prototype chain.
 *
 * @template O - The type of the object, constrained to be an object.
 * @param obj - The object to inspect.
 * @param key - The key (string, number, or symbol) to check for
 * in the object.
 * @returns `true` if the `key` exists in the `obj` (or its
 * prototype chain), `false` otherwise.
 * @example
 * ```typescript
 * const myObj = { name: "Alice", age: 30 };
 * const someKey: string | number = "name";
 * const anotherKey: string = "location";
 *
 * if (hasKey(myObj, someKey)) {
 *   // Here, TypeScript knows someKey is "name" | "age"
 *   console.log(myObj[someKey]); // Safe access
 * } else {
 *   // someKey is not a key of myObj
 * }
 *
 * if (hasKey(myObj, anotherKey)) {
 *   // This block would not be entered in this example
 * }
 *
 * class Parent {
 *   parentProp: string = "from parent";
 * }
 * class Child extends Parent {
 *   childProp: string = "from child";
 * }
 * const instance = new Child();
 * if (hasKey(instance, "parentProp")) {
 *   console.log("parentProp exists on instance:", instance.parentProp); // true
 * }
 * ```
 */
function hasKey<O extends object>(obj: O, key: PropertyKey): key is keyof O {
  return key in obj;
}

/**
 * In practiced this is used to send messages to methods exported by the
 * {@link MetamaskController}'s `createMetaRpcHandlerApi` method.
 *
 * @template Api - The type of the methods available on the MetaRPCClient.
 * @param connectionStream - The connection stream to use for the RPC client.
 * @returns An API that blends methods of our `MetaRPCClient` and an RPC service
 * that communicates over the provided `connectionStream` in order to remote
 * invoke methods available over the provided `Api` template type.
 */
export default function metaRPCClientFactory<Api extends HashMapFunctions>(
  connectionStream: Duplex,
) {
  const metaRPCClient = new MetaRPCClient(connectionStream);
  return new Proxy(metaRPCClient, {
    get: (
      object,
      property: keyof MetaRPCClient | Extract<keyof Api, 'string'>,
    ) => {
      // MetaRPCClient properties
      if (hasKey(object, property)) {
        return object[property];
      }
      // RemoteApi methods
      return async (...params: Json[]) => {
        const id = getNextId();
        const payload: JsonRpcRequest = {
          jsonrpc: '2.0',
          method: property,
          params,
          id,
        };
        return await object.send(id, payload);
      };
    },
  }) as MetaRPCClient & Api;
}
