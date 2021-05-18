import { strict as assert } from 'assert';
import { obj as createThoughStream } from 'through2';
import createMetaRPCHandler from './createMetaRPCHandler';

describe('createMetaRPCHandler', function () {
  it('can call the api when handler receives a JSON-RPC request', function (done) {
    const api = {
      foo: (param1) => {
        assert.strictEqual(param1, 'bar');
        done();
      },
    };
    const streamTest = createThoughStream();
    const handler = createMetaRPCHandler(api, streamTest);
    handler({
      id: 1,
      method: 'foo',
      params: ['bar'],
    });
  });
  it('can write the response to the outstream when api callback is called', function (done) {
    const api = {
      foo: (param1, cb) => {
        assert.strictEqual(param1, 'bar');
        cb(null, 'foobarbaz');
      },
    };
    const streamTest = createThoughStream();
    const handler = createMetaRPCHandler(api, streamTest);
    handler({
      id: 1,
      method: 'foo',
      params: ['bar'],
    });
    streamTest.on('data', (data) => {
      assert.strictEqual(data.result, 'foobarbaz');
      streamTest.end();
      done();
    });
  });
  it('can write the error to the outstream when api callback is called with an error', function (done) {
    const api = {
      foo: (param1, cb) => {
        assert.strictEqual(param1, 'bar');
        cb(new Error('foo-error'));
      },
    };
    const streamTest = createThoughStream();
    const handler = createMetaRPCHandler(api, streamTest);
    handler({
      id: 1,
      method: 'foo',
      params: ['bar'],
    });
    streamTest.on('data', (data) => {
      assert.strictEqual(data.error.message, 'foo-error');
      streamTest.end();
      done();
    });
  });
  it('can not throw an error for writing an error after end', function (done) {
    const api = {
      foo: (param1, cb) => {
        assert.strictEqual(param1, 'bar');
        cb(new Error('foo-error'));
      },
    };
    const streamTest = createThoughStream();
    const handler = createMetaRPCHandler(api, streamTest);
    streamTest.end();
    handler({
      id: 1,
      method: 'foo',
      params: ['bar'],
    });
    done();
  });
  it('can not throw an error for write after end', function (done) {
    const api = {
      foo: (param1, cb) => {
        assert.strictEqual(param1, 'bar');
        cb(undefined, {
          foo: 'bar',
        });
      },
    };
    const streamTest = createThoughStream();
    const handler = createMetaRPCHandler(api, streamTest);
    streamTest.end();
    handler({
      id: 1,
      method: 'foo',
      params: ['bar'],
    });
    done();
  });
});
