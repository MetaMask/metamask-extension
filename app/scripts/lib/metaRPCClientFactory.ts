import { JsonRpcError } from '@metamask/rpc-errors';
import SafeEventEmitter from '@metamask/safe-event-emitter';
import createRandomId from '../../../shared/modules/random-id';
import { TEN_SECONDS_IN_MILLISECONDS } from '../../../shared/lib/transactions-controller-utils';

// Custom error type
class DisconnectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DisconnectError';
  }
}

// Interface for JSON-RPC payload
interface JsonRpcPayload {
  jsonrpc: '2.0';
  id?: number;
  method?: string;
  params?: unknown[];
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
    stack?: string;
  };
}

// Type for callback function
type Callback = (error: Error | null, result?: unknown) => void;

// Interface for connection stream
interface ConnectionStream {
  on: (event: string, handler: (data: JsonRpcPayload) => void) => void;
  write: (payload: JsonRpcPayload) => void;
}

class MetaRPCClient {
  private connectionStream: ConnectionStream;
  private notificationChannel: SafeEventEmitter;
  private uncaughtErrorChannel: SafeEventEmitter;
  private requests: Map<number, Callback>;
  private responseHandled: Record<number, boolean>;
  public DisconnectError: typeof DisconnectError;

  constructor(connectionStream: ConnectionStream) {
    this.connectionStream = connectionStream;
    this.notificationChannel = new SafeEventEmitter();
    this.uncaughtErrorChannel = new SafeEventEmitter();
    this.requests = new Map();
    this.responseHandled = {};
    this.DisconnectError = DisconnectError;

    this.connectionStream.on('data', this.handleResponse.bind(this));
    this.connectionStream.on('end', this.close.bind(this));
  }

  send(id: number, payload: JsonRpcPayload, cb?: Callback): void {
    if (cb) {
      this.requests.set(id, cb);
    }
    this.connectionStream.write(payload);
    this.responseHandled[id] = false;

    if (payload.method === 'getState') {
      setTimeout(() => {
        if (!this.responseHandled[id] && cb) {
          delete this.responseHandled[id];
          cb(new Error('No response from RPC'));
          return;
        }
        delete this.responseHandled[id];
      }, TEN_SECONDS_IN_MILLISECONDS);
    }
  }

  onNotification(handler: (data: JsonRpcPayload) => void): void {
    this.notificationChannel.addListener('notification', handler);
  }

  onUncaughtError(handler: (error: JsonRpcError) => void): void {
    this.uncaughtErrorChannel.addListener('error', handler);
  }

  close(): void {
    this.notificationChannel.removeAllListeners();
    this.uncaughtErrorChannel.removeAllListeners();

    for (const [id, handler] of this.requests) {
      if (!this.responseHandled[id]) {
        this.responseHandled[id] = true;
        handler(new DisconnectError('disconnected'));
      }
    }
  }

  private handleResponse(data: JsonRpcPayload): void {
    const { id, result, error, method, params } = data;
    const isNotification = id === undefined && error === undefined;
    const cb = id !== undefined ? this.requests.get(id) : undefined;

    if (id !== undefined) {
      this.responseHandled[id] = true;
    }

    if (method && params && !isNotification) {
      return;
    }

    if (method && params && isNotification) {
      this.notificationChannel.emit('notification', data);
      return;
    }

    if (error) {
      const e = new JsonRpcError(error.code, error.message, error.data);
      e.stack = error.stack;
      if (cb && id !== undefined) {
        this.requests.delete(id);
        cb(e);
        return;
      }
      this.uncaughtErrorChannel.emit('error', e);
      return;
    }

    if (!cb || id === undefined) {
      return;
    }

    this.requests.delete(id);
    cb(null, result);
  }
}

const metaRPCClientFactory = (
  connectionStream: ConnectionStream,
): MetaRPCClient => {
  const metaRPCClient = new MetaRPCClient(connectionStream);
  return new Proxy(metaRPCClient, {
    get: (target: MetaRPCClient, property: string | symbol) => {
      if (property in target) {
        return (target as any)[property];
      }
      return (...args: unknown[]) => {
        const cb = args[args.length - 1] as Callback;
        const params = args.slice(0, -1);
        const id = createRandomId();
        const payload: JsonRpcPayload = {
          jsonrpc: '2.0',
          method: property as string,
          params,
          id,
        };
        target.send(id, payload, cb);
      };
    },
  });
};

export default metaRPCClientFactory;
