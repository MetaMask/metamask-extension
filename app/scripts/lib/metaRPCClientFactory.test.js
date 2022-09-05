/* eslint-disable jest/no-done-callback */
import { obj as createThoughStream } from 'through2';
import metaRPCClientFactory from './metaRPCClientFactory';

describe('metaRPCClientFactory', () => {
  it('should be able to make an rpc request with the method', () => {
    const streamTest = createThoughStream((chunk) => {
      expect(chunk.method).toStrictEqual('foo');
    });
    const metaRPCClient = metaRPCClientFactory(streamTest);
    metaRPCClient.foo();
  });
  it('should be able to make an rpc request/response with the method and params and node-style callback', (done) => {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    // make a "foo" method call
    metaRPCClient.foo('bar', (_, result) => {
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
  it('should be able to make an rpc request/error with the method and params and node-style callback', (done) => {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    // make a "foo" method call
    metaRPCClient.foo('bar', (err) => {
      expect(err.message).toStrictEqual('foo-message');
      expect(err.code).toStrictEqual(1);
      done();
    });

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
  });

  it('should be able to make an rpc request/response with the method and params and node-style callback with multiple instances of metaRPCClientFactory and the same connectionStream', (done) => {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);
    const metaRPCClient2 = metaRPCClientFactory(streamTest);

    // make a "foo" method call, followed by "baz" call on metaRPCClient2
    metaRPCClient.foo('bar', (_, result) => {
      expect(result).toStrictEqual('foobarbaz');
      metaRPCClient2.baz('bar', (err) => {
        expect(err).toBeNull();
        done();
      });
    });

    // fake a response
    metaRPCClient.requests.forEach((_, key) => {
      streamTest.write({
        jsonrpc: '2.0',
        id: key,
        result: 'foobarbaz',
      });
    });

    // fake client2's response
    metaRPCClient2.requests.forEach((_, key) => {
      streamTest.write({
        jsonrpc: '2.0',
        id: key,
        result: 'foobarbaz',
      });
    });
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
      metaRPCClient.getState('bad', (error, _) => {
        reject(error);
      }),
    );

    jest.runOnlyPendingTimers();
    await expect(errorPromise).rejects.toThrow('No response from RPC');

    jest.useRealTimers();
  });

  it('should fail all pending actions with a DisconnectError when the stream ends', (done) => {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    metaRPCClient.foo('bar', (err) => {
      expect(err).toBeInstanceOf(metaRPCClient.DisconnectError);
      expect(err.message).toStrictEqual('disconnected');
      done();
    });

    streamTest.emit('end');
  });
});
