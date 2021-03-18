import { EthereumRpcError } from 'eth-rpc-errors';
import SafeEventEmitter from 'safe-event-emitter';
import createRandomId from '../../../shared/modules/random-id';

class MetaRPCClient {
  constructor(connectionStream) {
    this.connectionStream = connectionStream;
    this.notificationChannel = new SafeEventEmitter();
    this.requests = new Map();
    this.connectionStream.on('data', this.handleResponse.bind(this));
    this.connectionStream.on('end', this.close.bind(this));
  }

  onNotification(handler) {
    this.notificationChannel.addListener('notification', (data) => {
      handler(data);
    });
  }

  close() {
    this.notificationChannel.removeAllListeners();
  }

  handleResponse(data) {
    const { id, result, error, method, params } = data;
    const cb = this.requests.get(id);

    if (method && params && id) {
      // dont handle server-side to client-side requests
      return;
    }
    if (method && params && !id) {
      // handle servier-side to client-side notification
      this.notificationChannel.emit('notification', data);
      return;
    }
    if (!cb) {
      // not found in request list
      return;
    }

    if (error) {
      const e = new EthereumRpcError(error.code, error.message, error.data);
      // preserve the stack from serializeError
      e.stack = error.stack;
      this.requests.delete(id);
      cb(e);
      return;
    }

    this.requests.delete(id);

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

        object.requests.set(id, cb);
        object.connectionStream.write({
          jsonrpc: '2.0',
          method: property,
          params,
          id,
        });
      };
    },
  });
};

export default metaRPCClientFactory;
