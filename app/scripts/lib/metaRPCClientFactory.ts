import SafeEventEmitter from '@metamask/safe-event-emitter';
import {
  Json,
  JsonRpcFailure,
  JsonRpcRequest,
  JsonRpcResponse,
  hasProperty,
} from '@metamask/utils';
import { JsonRpcError } from '@metamask/rpc-errors';
import { Writable } from 'readable-stream-3';
import { TEN_SECONDS_IN_MILLISECONDS } from '../../../shared/lib/transactions-controller-utils';
import getNextId from '../../../shared/modules/random-id';

export type MetaRpcClientFactory = MetaRPCClient &
  Record<string, (...args: unknown[]) => Promise<unknown>>;

class DisconnectError extends Error {}

type RequestId = string | number | null;

export class MetaRPCClient {
  private connectionStream: Writable;

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

  constructor(connectionStream: Writable) {
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
 * Creates a proxy of the MetaRPCClient that intercepts method calls and
 *
 * @param connectionStream - The connection stream to use for the RPC client.
 * @returns A proxy of the MetaRPCClient that intercepts method calls and
 */
export default function metaRPCClientFactory(
  connectionStream: Writable,
): MetaRpcClientFactory {
  const metaRPCClient = new MetaRPCClient(connectionStream);
  return new Proxy(metaRPCClient, {
    get: (object, property) => {
      if (hasKey(object, property)) {
        return object[property];
      }
      return async (...params: Json[]) => {
        const id = getNextId();
        const payload: JsonRpcRequest = {
          jsonrpc: '2.0',
          method: property as string,
          params,
          id,
        };
        return await object.send(id, payload);
      };
    },
  }) as MetaRpcClientFactory;
}

function hasKey<O extends object>(obj: O, key: PropertyKey): key is keyof O {
  return key in obj;
}
