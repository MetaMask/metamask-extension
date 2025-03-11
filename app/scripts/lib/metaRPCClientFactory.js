import { JsonRpcError } from '@metamask/rpc-errors';
import SafeEventEmitter from '@metamask/safe-event-emitter';
import createRandomId from '../../../shared/modules/random-id';
import { TEN_SECONDS_IN_MILLISECONDS } from '../../../shared/lib/transactions-controller-utils';

class DisconnectError extends Error {}

class MetaRPCClient {
  constructor(connectionStream) {
    this.connectionStream = connectionStream;
    this.notificationChannel = new SafeEventEmitter();
    this.uncaughtErrorChannel = new SafeEventEmitter();
    this.requests = new Map();
    this.connectionStream.on('data', this.handleResponse.bind(this));
    this.connectionStream.on('end', this.close.bind(this));
    this.responseHandled = {};
    this.DisconnectError = DisconnectError;
  }

  send(id, payload, cb) {
    this.requests.set(id, cb);
    this.connectionStream.write(payload);
    this.responseHandled[id] = false;
    if (payload.method === 'getState') {
      setTimeout(() => {
        if (!this.responseHandled[id] && cb) {
          delete this.responseHandled[id];
          return cb(new Error('No response from RPC'), null);
        }

        delete this.responseHandled[id];
        // needed for linter to pass
        return true;
      }, TEN_SECONDS_IN_MILLISECONDS);
    }
  }

  onNotification(handler) {
    this.notificationChannel.addListener('notification', (data) => {
      handler(data);
    });
  }

  onUncaughtError(handler) {
    this.uncaughtErrorChannel.addListener('error', (error) => {
      handler(error);
    });
  }

  close() {
    this.notificationChannel.removeAllListeners();
    this.uncaughtErrorChannel.removeAllListeners();
    // fail all unfinished requests
    for (const [id, handler] of this.requests) {
      if (!this.responseHandled[id]) {
        this.responseHandled[id] = true;
        handler(new DisconnectError('disconnected'));
      }
    }
  }

  handleResponse(data) {
    let { id, result, error, method, params } = data;
    const isNotification = id === undefined && error === undefined;
    const cb = this.requests.get(id);

    this.responseHandled[id] = true;

    if (method && params && !isNotification) {
      // dont handle server-side to client-side requests
      return;
    }
    if (method && params && isNotification) {
      // handle servier-side to client-side notification
      this.notificationChannel.emit('notification', data);
      return;
    }

    if (error) {
      const e = new JsonRpcError(error.code, error.message, error.data);
      // preserve the stack from serializeError
      e.stack = error.stack;
      if (cb) {
        this.requests.delete(id);
        cb(e);
        return;
      }
      this.uncaughtErrorChannel.emit('error', e);
      return;
    }

    if (!cb) {
      // not found in request list
      return;
    }

    this.requests.delete(id);

    if(result && result.internalAccounts){
      const original = result;
      const tracker = createTrackedObject(result);
      result = tracker.wrapped;

      setTimeout(() => {
        console.log({value: original, log: tracker.getAccessLog()})
      }, 5000);
    }

    cb(null, result);
  }
}

const metaRPCClientFactory = (connectionStream) => {
  const metaRPCClient = new MetaRPCClient(connectionStream);
  return new Proxy(metaRPCClient, {
    get: (object, property) => {
      if (object[property]) {
        return object[property];
      }
      return (...p) => {
        const cb = p[p.length - 1];
        const params = p.slice(0, -1);
        const id = createRandomId();
        const payload = {
          jsonrpc: '2.0',
          method: property,
          params,
          id,
        };
        object.send(id, payload, cb);
      };
    },
  });
};

export default metaRPCClientFactory;


function createTrackedObject(obj) {

  // Store access records: path -> array of stack traces
  const accessLog = new Map();

  if (typeof obj !== 'object' || obj === null) {
    return {
      wrapped: obj,
      getAccessLog: () => Object.fromEntries(accessLog)
    };
  }

  obj.___test = true;

  // Function to create a proxy handler with the current path
  function createHandler(path = []) {
    return {
      get(target, property, receiver) {
        // Check if the property is a Symbol
        if (typeof property === 'symbol') {
          // Skip tracking and just return the value
          return Reflect.get(target, property, receiver);
        }

        //
        if(property === "___test"){
          debugger;
        }

        // Build the path with non-Symbol properties
        const newPath = path.concat(property);
        const pathStr = newPath.join('.');

        // Record the access with the current stack trace
        if (!newPath.startsWith("tokenList")) {
          const stack = new Error().stack;
          if (!accessLog.has(pathStr)) {
            accessLog.set(pathStr, 1);
          } else {
            accessLog.set(pathStr, accessLog.get(pathStr) + 1);
          }
        }
        //console.log('Accessed', pathStr);

        const value = Reflect.get(target, property, receiver);
        if (typeof value === 'object' && value !== null) {
          return new Proxy(value, createHandler(newPath));
        }
        return value;
      }
    };
  }

  // Wrap the original object with a proxy starting with an empty path
  const wrapped = new Proxy(obj, createHandler([]));

  // Return an object with the wrapped object and a method to get the access log
  return {
    wrapped,
    getAccessLog: () => Object.fromEntries(accessLog)
  };
}