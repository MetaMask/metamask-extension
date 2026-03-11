import { obj as createThoughStream } from 'through2';
import { trace } from '../../../shared/lib/trace';
import createMetaRPCHandler from './createMetaRPCHandler';

jest.mock('../../../shared/lib/trace', () => ({
  trace: jest.fn((_request, fn) => fn()),
  TraceName: { BackgroundRpc: 'Background RPC' },
}));

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
  it('can write the response to the outstream', () => {
    const api = {
      foo: (param1) => {
        expect(param1).toStrictEqual('bar');
        return 'foobarbaz';
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
  it('can write an async response to the outstream', () => {
    const api = {
      foo: async (param1) => {
        expect(param1).toStrictEqual('bar');
        await new Promise((resolve) => setTimeout(() => resolve(), 100));
        return 'foobarbaz';
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
  it('can write the error to the outstream when method throws an error', () => {
    const api = {
      foo: (param1) => {
        expect(param1).toStrictEqual('bar');
        throw new Error('foo-error');
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
      expect(data.error.data.cause.message).toStrictEqual('foo-error');
      streamTest.end();
    });
  });
  it('can not throw an error for writing an error after end', () => {
    const api = {
      foo: (param1) => {
        expect(param1).toStrictEqual('bar');
        throw new Error('foo-error');
      },
    };
    const streamTest = createThoughStream();
    const handler = createMetaRPCHandler(api, streamTest);
    streamTest.end();
    expect(() => {
      handler({
        id: 1,
        method: 'foo',
        params: ['bar'],
      });
    }).not.toThrow();
  });
  it('can not throw an error for write after end', () => {
    const api = {
      foo: (param1) => {
        expect(param1).toStrictEqual('bar');
        return {
          foo: 'bar',
        };
      },
    };
    const streamTest = createThoughStream();
    const handler = createMetaRPCHandler(api, streamTest);
    streamTest.end();
    expect(() => {
      handler({
        id: 1,
        method: 'foo',
        params: ['bar'],
      });
    }).not.toThrow();
  });

  describe('trace context extraction', () => {
    beforeEach(() => {
      jest.mocked(trace).mockClear();
    });

    it('strips trace context from params and wraps call in trace', async () => {
      const api = {
        foo: jest.fn().mockReturnValue('result'),
      };
      const streamTest = createThoughStream();
      const handler = createMetaRPCHandler(api, streamTest);

      await handler({
        id: 1,
        method: 'foo',
        params: [
          'bar',
          { _traceContext: { _traceId: 'trace123', _spanId: 'span456' } },
        ],
      });

      expect(trace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Background RPC: foo',
          parentContext: { _traceId: 'trace123', _spanId: 'span456' },
          op: 'rpc.handler',
          data: { method: 'foo' },
        }),
        expect.any(Function),
      );
      expect(api.foo).toHaveBeenCalledWith('bar');
    });

    it('includes controller name in span when _controllerName is set', async () => {
      const fn = jest.fn().mockReturnValue('result');
      fn._controllerName = 'PreferencesController';
      const api = { foo: fn };
      const streamTest = createThoughStream();
      const handler = createMetaRPCHandler(api, streamTest);

      await handler({
        id: 1,
        method: 'foo',
        params: [
          'bar',
          { _traceContext: { _traceId: 'trace123', _spanId: 'span456' } },
        ],
      });

      expect(trace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Background RPC: PreferencesController.foo',
          data: { method: 'foo', controller: 'PreferencesController' },
        }),
        expect.any(Function),
      );
    });

    it('does not wrap in trace when no trace context present', async () => {
      const api = {
        foo: jest.fn().mockReturnValue('result'),
      };
      const streamTest = createThoughStream();
      const handler = createMetaRPCHandler(api, streamTest);

      await handler({
        id: 1,
        method: 'foo',
        params: ['bar'],
      });

      expect(trace).not.toHaveBeenCalled();
      expect(api.foo).toHaveBeenCalledWith('bar');
    });

    it('handles empty params with no trace context', async () => {
      const api = {
        foo: jest.fn().mockReturnValue('result'),
      };
      const streamTest = createThoughStream();
      const handler = createMetaRPCHandler(api, streamTest);

      await handler({
        id: 1,
        method: 'foo',
        params: [],
      });

      expect(trace).not.toHaveBeenCalled();
      expect(api.foo).toHaveBeenCalledWith();
    });

    it('preserves throw when params is undefined (matches original behavior)', async () => {
      const api = {
        foo: jest.fn().mockReturnValue('result'),
      };
      const streamTest = createThoughStream();
      const handler = createMetaRPCHandler(api, streamTest);

      const dataPromise = new Promise((resolve) => {
        streamTest.on('data', resolve);
      });

      await handler({
        id: 1,
        method: 'foo',
        params: undefined,
      });

      const data = await dataPromise;
      expect(trace).not.toHaveBeenCalled();
      expect(api.foo).not.toHaveBeenCalled();
      expect(data.error).toBeDefined();
      expect(data.error.message).toMatch(/not iterable|iterable|spread/iu);
    });

    it('does not strip last param when _traceContext has wrong shape (legitimate param preserved)', async () => {
      const api = {
        foo: jest.fn().mockReturnValue('result'),
      };
      const streamTest = createThoughStream();
      const handler = createMetaRPCHandler(api, streamTest);
      const legitimateParam = { _traceContext: { custom: true } };

      await handler({
        id: 1,
        method: 'foo',
        params: ['bar', legitimateParam],
      });

      expect(trace).not.toHaveBeenCalled();
      expect(api.foo).toHaveBeenCalledWith('bar', legitimateParam);
    });
  });
});
