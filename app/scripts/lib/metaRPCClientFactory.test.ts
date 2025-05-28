/* eslint-disable jest/no-done-callback */
import { obj as createThroughStream } from 'through2';
import metaRPCClientFactory from './metaRPCClientFactory';

describe('metaRPCClientFactory', () => {
  it('should be able to make an rpc request with the method', () => {
    const streamTest = createThroughStream((chunk) => {
      expect(chunk.method).toStrictEqual('foo');
    });
    const metaRPCClient = metaRPCClientFactory(streamTest);
    metaRPCClient.foo();
  });
  it('should be able to make an rpc request/response with the method and params', (done) => {
    const streamTest = createThroughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    // make a "foo" method call
    metaRPCClient.foo('bar').then((result) => {
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
    const streamTest = createThroughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    // make a "foo" method call
    const requestProm = metaRPCClient.foo('bar');

    metaRPCClient.requests.forEach((_, key) => {
      streamTest.write({
        jsonrpc: '2.0',
        id: key,
        error: {
          code: 1,
          message: 'foo-message',
        },
      });
    });

    await expect(requestProm).rejects.toThrow({
      message: 'foo-message',
      code: 1,
    });
  });

  it('should be able to make an rpc request/response with the method and params with multiple instances of metaRPCClientFactory and the same connectionStream', async () => {
    const streamTest = createThroughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);
    const metaRPCClient2 = metaRPCClientFactory(streamTest);

    // make a "foo" method call, followed by "baz" call on metaRPCClient2
    const requestProm = metaRPCClient.foo('bar');
    const requestProm2 = requestProm.then(() => metaRPCClient2.baz('bar'));

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
        result: 'foobarbaz',
      });
    });

    await expect(requestProm2).resolves.toStrictEqual('foobarbaz');
  });

  it('should be able to handle notifications', (done) => {
    const streamTest = createThroughStream();
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
    const streamTest = createThroughStream();
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

  it('should be able to handle errors with null id', (done) => {
    const streamTest = createThroughStream();
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
    const streamTest = createThroughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    const errorPromise = new Promise((_resolve, reject) =>
      metaRPCClient.getState('bad').catch((error) => {
        reject(error);
      }),
    );

    jest.runOnlyPendingTimers();
    await expect(errorPromise).rejects.toThrow('No response from RPC');

    jest.useRealTimers();
  });

  it('should cancel the request timer when handling its response', async () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const streamTest = createThroughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    // getState is special, as it is the only method that starts a timeout
    const requestProm = metaRPCClient.getState('bar');

    const requests = [...metaRPCClient.requests];
    metaRPCClient.requests.forEach((_, key) => {
      streamTest.write({
        jsonrpc: '2.0',
        id: key,
        result: 'foobarbaz',
      });
    });

    await expect(requestProm).resolves.toStrictEqual('foobarbaz');

    const [, { timeout }] = requests[0];
    expect(clearTimeoutSpy).toHaveBeenCalledWith(timeout);
    jest.useRealTimers();
  });

  it('should clear pending timers with a DisconnectError when the stream ends', async () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const streamTest = createThroughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    // getState is special, as it is the only method that starts a timeout
    const requestProm = metaRPCClient.getState('bar');
    const [, { timeout }] = [...metaRPCClient.requests][0];
    streamTest.emit('end');

    await expect(requestProm).rejects.toThrow();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(timeout);
    jest.useRealTimers();
  });

  it('should fail all pending actions with a DisconnectError when the stream ends', async () => {
    const streamTest = createThroughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    const requestProm = metaRPCClient.foo('bar');
    streamTest.emit('end');

    await expect(requestProm).rejects.toThrow(
      new metaRPCClient.DisconnectError('disconnected'),
    );
  });
});
