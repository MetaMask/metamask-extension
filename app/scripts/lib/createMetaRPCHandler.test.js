import { obj as createThoughStream } from 'through2';
import createMetaRPCHandler from './createMetaRPCHandler';

describe('createMetaRPCHandler', () => {
  it('can call the api when handler receives a JSON-RPC request', () => {
    const api = {
      foo: (param1) => {
        expect(param1).toStrictEqual('bar');
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
  it('can write the response to the outstream when api callback is called', () => {
    const api = {
      foo: (param1, cb) => {
        expect(param1).toStrictEqual('bar');
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
      expect(data.result).toStrictEqual('foobarbaz');
      streamTest.end();
    });
  });
  it('can write the error to the outstream when api callback is called with an error', () => {
    const api = {
      foo: (param1, cb) => {
        expect(param1).toStrictEqual('bar');
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
      expect(data.error.message).toStrictEqual('foo-error');
      streamTest.end();
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
