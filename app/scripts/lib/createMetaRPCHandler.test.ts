import { PassThrough } from 'stream';
import type { JsonRpcRequest, PendingJsonRpcResponse } from '@metamask/utils';
import type { TaggedApiMethod } from '../messenger-client-init/utils';
import { continueTraceContext, trace } from '../../../shared/lib/trace';
import {
  admitTraceWrappers,
  shouldSampleRootWrapper,
  shouldSampleWrappers,
} from '../../../shared/lib/wrapper-sampling';
import createMetaRPCHandler from './createMetaRPCHandler';

jest.mock('../../../shared/lib/trace', () => {
  const actual = jest.requireActual('../../../shared/lib/trace');
  return {
    trace: jest.fn((_request: unknown, fn: () => unknown) => fn()),
    continueTraceContext: jest.fn((_ctx: unknown, fn: () => unknown) => fn()),
    extractTraceMetadata: actual.extractTraceMetadata,
    sentryGetActiveSpan: jest.fn(() => ({
      spanContext: () => ({ traceId: 'root-trace-id' }),
    })),
  };
});

jest.mock('../../../shared/lib/wrapper-sampling', () => ({
  shouldSampleWrappers: jest.fn().mockReturnValue(true),
  shouldSampleRootWrapper: jest.fn().mockReturnValue(true),
  admitTraceWrappers: jest.fn((_traceId: unknown, fn: () => unknown) => fn()),
}));

type Api = Record<string, TaggedApiMethod>;

const createStream = () => new PassThrough({ objectMode: true });

describe('createMetaRPCHandler', () => {
  it('can call the api when handler receives a JSON-RPC request', () => {
    const api = {
      foo: (param1: unknown) => {
        expect(param1).toStrictEqual('bar');
      },
    } as unknown as Api;
    const streamTest = createStream();
    const handler = createMetaRPCHandler(api, streamTest);
    handler({
      jsonrpc: '2.0',
      id: 1,
      method: 'foo',
      params: ['bar'],
    });
  });

  it('can write the response to the outstream', () => {
    const api = {
      foo: (param1: unknown) => {
        expect(param1).toStrictEqual('bar');
        return 'foobarbaz';
      },
    } as unknown as Api;
    const streamTest = createStream();
    const handler = createMetaRPCHandler(api, streamTest);
    handler({
      jsonrpc: '2.0',
      id: 1,
      method: 'foo',
      params: ['bar'],
    });
    streamTest.on('data', (data: PendingJsonRpcResponse) => {
      expect(data.result).toStrictEqual('foobarbaz');
      streamTest.end();
    });
  });

  it('can write an async response to the outstream', () => {
    const api = {
      foo: async (param1: unknown) => {
        expect(param1).toStrictEqual('bar');
        await new Promise<void>((resolve) => setTimeout(() => resolve(), 100));
        return 'foobarbaz';
      },
    } as unknown as Api;
    const streamTest = createStream();
    const handler = createMetaRPCHandler(api, streamTest);
    handler({
      jsonrpc: '2.0',
      id: 1,
      method: 'foo',
      params: ['bar'],
    });
    streamTest.on('data', (data: PendingJsonRpcResponse) => {
      expect(data.result).toStrictEqual('foobarbaz');
      streamTest.end();
    });
  });

  it('can write the error to the outstream when method throws an error', () => {
    const api = {
      foo: (param1: unknown) => {
        expect(param1).toStrictEqual('bar');
        throw new Error('foo-error');
      },
    } as unknown as Api;
    const streamTest = createStream();
    const handler = createMetaRPCHandler(api, streamTest);
    handler({
      jsonrpc: '2.0',
      id: 1,
      method: 'foo',
      params: ['bar'],
    });
    streamTest.on('data', (data: PendingJsonRpcResponse) => {
      const err = data.error as unknown as {
        message: string;
        data: { cause: { message: string } };
      };
      expect(err.message).toStrictEqual('foo-error');
      expect(err.data.cause.message).toStrictEqual('foo-error');
      streamTest.end();
    });
  });

  it('can not throw an error for writing an error after end', () => {
    const api = {
      foo: (param1: unknown) => {
        expect(param1).toStrictEqual('bar');
        throw new Error('foo-error');
      },
    } as unknown as Api;
    const streamTest = createStream();
    const handler = createMetaRPCHandler(api, streamTest);
    streamTest.end();
    expect(() => {
      handler({
        jsonrpc: '2.0',
        id: 1,
        method: 'foo',
        params: ['bar'],
      });
    }).not.toThrow();
  });

  it('can not throw an error for write after end', () => {
    const api = {
      foo: (param1: unknown) => {
        expect(param1).toStrictEqual('bar');
        return {
          foo: 'bar',
        };
      },
    } as unknown as Api;
    const streamTest = createStream();
    const handler = createMetaRPCHandler(api, streamTest);
    streamTest.end();
    expect(() => {
      handler({
        jsonrpc: '2.0',
        id: 1,
        method: 'foo',
        params: ['bar'],
      });
    }).not.toThrow();
  });

  /* eslint-disable @typescript-eslint/naming-convention */
  describe('trace context extraction', () => {
    beforeEach(() => {
      jest.mocked(trace).mockClear();
      jest.mocked(continueTraceContext).mockClear();
      jest.mocked(shouldSampleWrappers).mockReset().mockReturnValue(true);
      jest.mocked(shouldSampleRootWrapper).mockReset().mockReturnValue(true);
    });

    it('strips trace context from params and wraps call in trace', async () => {
      const foo = jest.fn().mockReturnValue('result');
      const api = { foo } as unknown as Api;
      const streamTest = createStream();
      const handler = createMetaRPCHandler(api, streamTest);

      await handler({
        jsonrpc: '2.0',
        id: 1,
        method: 'foo',
        params: [
          'bar',
          {
            _trace: {
              context: { _traceId: 'trace123', _spanId: 'span456' },
              spanName: 'Background RPC: foo',
            },
          },
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
      expect(foo).toHaveBeenCalledWith('bar');
    });

    it('includes controller name in span when _controllerName is set on the method reference', async () => {
      const fn = jest
        .fn()
        .mockReturnValue('result') as unknown as TaggedApiMethod;
      fn._controllerName = 'PreferencesController';
      const api: Api = { foo: fn };
      const streamTest = createStream();
      const handler = createMetaRPCHandler(api, streamTest);

      await handler({
        jsonrpc: '2.0',
        id: 1,
        method: 'foo',
        params: [
          'bar',
          {
            _trace: {
              context: { _traceId: 'trace123', _spanId: 'span456' },
              spanName: 'Background RPC: foo',
            },
          },
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

    it('uses span metadata without interpreting the RPC method or arguments', async () => {
      const messengerCall = jest.fn().mockReturnValue({ isUnlocked: true });
      const streamTest = createStream();
      const handler = createMetaRPCHandler(
        { dispatch: messengerCall },
        streamTest,
      );

      await handler({
        jsonrpc: '2.0',
        id: 1,
        method: 'dispatch',
        params: [
          'AppStateController:getState',
          [],
          {
            _trace: {
              context: { _traceId: 'trace123', _spanId: 'span456' },
              spanName: 'Background RPC: AppStateController:getState',
              messengerAction: 'AppStateController:getState',
            },
          },
        ],
      });

      expect(trace).toHaveBeenCalledWith(
        {
          name: 'Background RPC: AppStateController:getState',
          parentContext: { _traceId: 'trace123', _spanId: 'span456' },
          op: 'rpc.handler',
          data: {
            method: 'dispatch',
            action: 'AppStateController:getState',
          },
        },
        expect.any(Function),
      );
      expect(messengerCall).toHaveBeenCalledWith(
        'AppStateController:getState',
        [],
      );
    });

    it('does not interpret messengerCall arguments when no trace metadata is present', async () => {
      const messengerCall = jest.fn();
      const streamTest = createStream();
      const handler = createMetaRPCHandler({ messengerCall }, streamTest);

      await handler({
        jsonrpc: '2.0',
        id: 1,
        method: 'messengerCall',
        params: [[]],
      });

      expect(messengerCall).toHaveBeenCalledWith([]);
      // The root span for a call without UI context is named after the method,
      // never after an argument.
      expect(trace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Background RPC: messengerCall',
          data: { method: 'messengerCall' },
        }),
        expect.any(Function),
      );
    });

    it('continues trace context but skips rpc.handler span when shouldSampleWrappers rejects', async () => {
      jest.mocked(shouldSampleWrappers).mockReturnValue(false);
      const foo = jest.fn().mockReturnValue('result');
      const api = { foo } as unknown as Api;
      const streamTest = createStream();
      const handler = createMetaRPCHandler(api, streamTest);

      await handler({
        jsonrpc: '2.0',
        id: 1,
        method: 'foo',
        params: [
          'bar',
          {
            _trace: {
              context: { _traceId: 'trace123', _spanId: 'span456' },
              spanName: 'Background RPC: foo',
            },
          },
        ],
      });

      expect(trace).not.toHaveBeenCalled();
      expect(continueTraceContext).toHaveBeenCalledWith(
        { _traceId: 'trace123', _spanId: 'span456' },
        expect.any(Function),
      );
      expect(foo).toHaveBeenCalledWith('bar');
    });

    it('wraps call in a new root trace when no trace context present', async () => {
      const foo = jest.fn().mockReturnValue('result');
      const api = { foo } as unknown as Api;
      const streamTest = createStream();
      const handler = createMetaRPCHandler(api, streamTest);

      await handler({
        jsonrpc: '2.0',
        id: 1,
        method: 'foo',
        params: ['bar'],
      });

      expect(trace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Background RPC: foo',
          op: 'rpc.handler',
          root: true,
          data: { method: 'foo' },
        }),
        expect.any(Function),
      );
      expect(admitTraceWrappers).toHaveBeenCalledWith(
        'root-trace-id',
        expect.any(Function),
      );
      expect(foo).toHaveBeenCalledWith('bar');
    });

    it('calls the handler without a trace when the root sub-sample rejects', async () => {
      jest.mocked(shouldSampleRootWrapper).mockReturnValue(false);
      const foo = jest.fn().mockReturnValue('result');
      const api = { foo } as unknown as Api;
      const streamTest = createStream();
      const handler = createMetaRPCHandler(api, streamTest);

      await handler({
        jsonrpc: '2.0',
        id: 1,
        method: 'foo',
        params: ['bar'],
      });

      expect(trace).not.toHaveBeenCalled();
      expect(foo).toHaveBeenCalledWith('bar');
      expect(streamTest.read()).toStrictEqual({
        jsonrpc: '2.0',
        result: 'result',
        id: 1,
      });
    });

    it('wraps call in a new root trace when params are empty and no trace context', async () => {
      const foo = jest.fn().mockReturnValue('result');
      const api = { foo } as unknown as Api;
      const streamTest = createStream();
      const handler = createMetaRPCHandler(api, streamTest);

      await handler({
        jsonrpc: '2.0',
        id: 1,
        method: 'foo',
        params: [],
      });

      expect(trace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Background RPC: foo',
          op: 'rpc.handler',
          root: true,
        }),
        expect.any(Function),
      );
      expect(foo).toHaveBeenCalledWith();
    });

    it('wraps call in a new root trace when params are non-array (handles undefined and JSON-RPC by-name params)', async () => {
      const foo = jest.fn().mockReturnValue('result');
      const api = { foo } as unknown as Api;
      const streamTest = createStream();
      const handler = createMetaRPCHandler(api, streamTest);

      await handler({
        jsonrpc: '2.0',
        id: 1,
        method: 'foo',
        params: undefined,
      } as JsonRpcRequest);

      expect(trace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Background RPC: foo',
          op: 'rpc.handler',
          root: true,
        }),
        expect.any(Function),
      );
      expect(foo).toHaveBeenCalledWith(undefined);
    });

    it('wraps call in a new root trace but preserves legitimate param when _trace has wrong shape', async () => {
      const foo = jest.fn().mockReturnValue('result');
      const api = { foo } as unknown as Api;
      const streamTest = createStream();
      const handler = createMetaRPCHandler(api, streamTest);
      const legitimateParam = { _trace: { custom: true } };

      await handler({
        jsonrpc: '2.0',
        id: 1,
        method: 'foo',
        params: ['bar', legitimateParam],
      });

      expect(trace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Background RPC: foo',
          op: 'rpc.handler',
          root: true,
        }),
        expect.any(Function),
      );
      expect(foo).toHaveBeenCalledWith('bar', legitimateParam);
    });
  });
  /* eslint-enable @typescript-eslint/naming-convention */
});
