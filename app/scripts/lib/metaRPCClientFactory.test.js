import { strict as assert } from 'assert';
import { obj as createThoughStream } from 'through2';
import metaRPCClientFactory from './metaRPCClientFactory';

describe('metaRPCClientFactory', function () {
  it('should be able to make an rpc request with the method', function (done) {
    const streamTest = createThoughStream((chunk) => {
      assert.strictEqual(chunk.method, 'foo');
      done();
    });
    const metaRPCClient = metaRPCClientFactory(streamTest);
    metaRPCClient.foo();
  });
  it('should be able to make an rpc request/response with the method and params and node-style callback', function (done) {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    // make a "foo" method call
    metaRPCClient.foo('bar', (_, result) => {
      assert.strictEqual(result, 'foobarbaz');
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
  it('should be able to make an rpc request/error with the method and params and node-style callback', function (done) {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    // make a "foo" method call
    metaRPCClient.foo('bar', (err) => {
      assert.strictEqual(err.message, 'foo-message');
      assert.strictEqual(err.code, 1);
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

  it('should be able to make an rpc request/response with the method and params and node-style callback with multiple instances of metaRPCClientFactory and the same connectionStream', function (done) {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);
    const metaRPCClient2 = metaRPCClientFactory(streamTest);

    // make a "foo" method call, followed by "baz" call on metaRPCClient2
    metaRPCClient.foo('bar', (_, result) => {
      assert.strictEqual(result, 'foobarbaz');
      metaRPCClient2.baz('bar', (err) => {
        assert.strictEqual(err, null);
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

  it('should be able to handle notifications', function (done) {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    metaRPCClient.onNotification((notification) => {
      assert(notification.method, 'foobarbaz');
      done();
    });

    // send a notification
    streamTest.write({
      jsonrpc: '2.0',
      method: 'foobarbaz',
      params: ['bar'],
    });
  });

  it('should be able to handle errors with no id', function (done) {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    metaRPCClient.onUncaughtError((error) => {
      assert(error.code, 1);
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

  it('should be able to handle errors with null id', function (done) {
    const streamTest = createThoughStream();
    const metaRPCClient = metaRPCClientFactory(streamTest);

    metaRPCClient.onUncaughtError((error) => {
      assert(error.code, 1);
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
});
