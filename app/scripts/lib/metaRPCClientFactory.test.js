/* eslint-disable jest/no-done-callback */
import { obj as createThoughStream } from 'through2';
import { JsonRpcError } from '@metamask/rpc-errors';
import metaRPCClientFactory, { DisconnectError } from './metaRPCClientFactory';

describe('metaRPCClientFactory', () => {
  it('should be able to make an rpc request with the method', () => {
    const streamTest = createThoughStream((chunk) => {
      expect(chunk.method).toStrictEqual('foo');
    });
    const metaRPCClient = metaRPCClientFactory(streamTest);
    metaRPCClient.foo();
  });

  it('should be able to make an rpc request/response with the method and params', (done) => {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    // make a "foo" method call
    metaRPCClient.bar('baz').then((result) => {
      expect(result).toStrictEqual('foobarbaz');
      done();
    });

    // fake a response
    metaRPCClient.requests.forEach((_, key) => {
      streamTest.write({
        jsonrpc: '2.0',
        id: key,
        result: 'foobarbaz',
      });
    });
  });

  it('should be able to make an rpc request/error with the method and params', async () => {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    // make a "bar" method call
    const requestProm = metaRPCClient.bar('baz');

    metaRPCClient.requests.forEach((_, key) => {
      streamTest.write({
        jsonrpc: '2.0',
        id: key,
        error: {
          code: 1,
          message: 'bar-message',
        },
      });
    });

    await expect(requestProm).rejects.toThrow(
      new JsonRpcError(1, 'bar-message'),
    );
  });

  it('should be able to make an rpc request/response with the method and params with multiple instances of metaRPCClientFactory and the same connectionStream', async () => {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);
    const metaRPCClient2 = metaRPCClientFactory(streamTest);

    // make a "foo" method call, followed by "bar" call on metaRPCClient2
    const requestProm = metaRPCClient.foo();
    const requestProm2 = requestProm.then(() => metaRPCClient2.bar('baz'));

    // fake a response
    metaRPCClient.requests.forEach((_, key) => {
      streamTest.write({
        jsonrpc: '2.0',
        id: key,
        result: 'foobarbaz',
      });
    });

    await expect(requestProm).resolves.toStrictEqual('foobarbaz');

    // fake client2's response
    metaRPCClient2.requests.forEach((_, key) => {
      streamTest.write({
        jsonrpc: '2.0',
        id: key,
        result: 'bazbarfoo',
      });
    });

    await expect(requestProm2).resolves.toStrictEqual('bazbarfoo');
  });

  it('should be able to handle notifications', (done) => {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    metaRPCClient.onNotification((notification) => {
      expect(notification.method).toStrictEqual('foobarbaz');
      done();
    });

    // send a notification
    streamTest.write({
      jsonrpc: '2.0',
      method: 'foobarbaz',
      params: ['bar'],
    });
  });

  it('should be able to handle errors with no id', (done) => {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    metaRPCClient.onUncaughtError((error) => {
      expect(error.code).toStrictEqual(1);
      done();
    });

    streamTest.write({
      jsonrpc: '2.0',
      error: {
        code: 1,
        message: 'error msg',
      },
    });
  });

  it('should cache the proxied rpc *methods*, but not the results', async () => {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    const rpcMethod1 = metaRPCClient.bar;
    const rpcMethod2 = metaRPCClient.bar;
    // make sure we are using a cached function.
    expect(rpcMethod1).toEqual(rpcMethod2);
    const rpcPromise1 = rpcMethod1.call(metaRPCClient, 'baz');
    const rpcPromise2 = rpcMethod2.call(metaRPCClient, 'baz');

    // fake unique responses two each request
    const keys = [...metaRPCClient.requests.keys()];
    for (const key of keys) {
      streamTest.write({
        jsonrpc: '2.0',
        id: key,
        result: `Fake response for ${key}`,
      });
    }
    expect(keys[0]).not.toEqual(keys[1]); // sanity check; keys should be unique
    await expect(rpcPromise1).resolves.toStrictEqual(
      `Fake response for ${keys[0]}`,
    );
    await expect(rpcPromise2).resolves.toStrictEqual(
      `Fake response for ${keys[1]}`,
    );
  });

  it('should be able to handle errors with null id', (done) => {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    metaRPCClient.onUncaughtError((error) => {
      expect(error.code).toStrictEqual(1);
      done();
    });

    streamTest.write({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: 1,
        message: 'error msg',
      },
    });
  });

  it('should be able to handle no message within TIMEOUT secs for getState', async () => {
    jest.useFakeTimers();
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    const errorPromise = new Promise((_resolve, reject) =>
      metaRPCClient.getState().catch((error) => {
        reject(error);
      }),
    );

    jest.runOnlyPendingTimers();
    await expect(errorPromise).rejects.toThrow('No response from RPC');

    jest.useRealTimers();
  });

  it('should fail all pending actions with a DisconnectError when the stream ends', async () => {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    const requestProm = metaRPCClient.foo();
    streamTest.emit('end');

    await expect(requestProm).rejects.toThrow(
      new DisconnectError('disconnected'),
    );
  });

  it('should cancel the request timer when handling its response', async () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    // getState is special, as it is the only method that starts a timeout
    const requestProm = metaRPCClient.getState();

    const requests = [...metaRPCClient.requests];
    metaRPCClient.requests.forEach((_, key) => {
      streamTest.write({
        jsonrpc: '2.0',
        id: key,
        result: 'foobarbaz',
      });
    });

    await expect(requestProm).resolves.toStrictEqual('foobarbaz');

    const [, { timer }] = requests[0];
    expect(clearTimeoutSpy).toHaveBeenCalledWith(timer);
    jest.useRealTimers();
  });

  it('should clear pending timers with a DisconnectError when the stream ends', async () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    // getState is special, as it is the only method that starts a timeout
    const requestProm = metaRPCClient.getState();
    const [, { timer }] = [...metaRPCClient.requests][0];
    streamTest.emit('end');

    await expect(requestProm).rejects.toThrow();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(timer);
    jest.useRealTimers();
  });

  it('should not throw when receiving junk data over the stream', async () => {
    const streamTest = createThoughStream();
    metaRPCClientFactory(streamTest);

    // this would throw if we just tried parsing any `data` `metaRPCClientFactory` received as if it were what we expected.
    streamTest.write(undefined);
    streamTest.write('junk');
    streamTest.write(Buffer.from('junk'));
    streamTest.write(123);
  });
});
