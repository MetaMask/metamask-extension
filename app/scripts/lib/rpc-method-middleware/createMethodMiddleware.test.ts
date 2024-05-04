import { JsonRpcEngine, JsonRpcFailure } from 'json-rpc-engine';
import {
  assertIsJsonRpcFailure,
  assertIsJsonRpcSuccess,
} from '@metamask/utils';
import { HandlerMiddlewareFunction } from '@metamask/permission-controller';
import { EveryHook, createMethodMiddleware } from '.';

type MockHandlerInterface = {
  implementation: HandlerMiddlewareFunction<
    Record<'hook1' | 'hook2', () => number>,
    [number],
    number
  >;
  hookNames: Record<string, true>;
  methodNames: string[];
};

jest.mock('@metamask/permission-controller', () => ({
  permissionRpcMethods: { handlers: [] },
}));

jest.mock('./handlers', () => [
  {
    implementation: (req, res, _next, end, hooks) => {
      if (Array.isArray(req.params)) {
        switch (req.params[0]) {
          case 1:
            res.result = hooks.hook1();
            break;
          case 2:
            res.result = hooks.hook2();
            break;
          case 3:
            return end(new Error('test error'));
          default:
            throw new Error(`unexpected param "${req.params[0]}"`);
        }
      }
      return end();
    },
    hookNames: { hook1: true, hook2: true },
    methodNames: ['method1', 'method2'],
  } as MockHandlerInterface,
]);

describe('createMethodMiddleware', () => {
  const method1 = 'method1';

  const getDefaultHooks = () =>
    ({
      hook1: () => 42,
      hook2: () => 99,
    } as unknown as EveryHook);

  it('should return a function', () => {
    const middleware = createMethodMiddleware(getDefaultHooks());
    expect(typeof middleware).toBe('function');
  });

  it('should throw an error if a required hook is missing', () => {
    const hooks = { hook1: () => 42 };

    // @ts-expect-error Intentional destructive testing
    expect(() => createMethodMiddleware(hooks)).toThrow(
      'Missing expected hooks',
    );
  });

  it('should throw an error if an extraneous hook is provided', () => {
    const hooks = {
      ...getDefaultHooks(),
      extraneousHook: () => 100,
    };

    expect(() => createMethodMiddleware(hooks)).toThrow(
      'Received unexpected hooks',
    );
  });

  it('should call the handler for the matching method (uses hook1)', async () => {
    const middleware = createMethodMiddleware(getDefaultHooks());
    const engine = new JsonRpcEngine();
    engine.push(middleware);

    const response = await engine.handle({
      jsonrpc: '2.0',
      id: 1,
      method: method1,
      params: [1],
    });
    assertIsJsonRpcSuccess(response);

    expect(response.result).toBe(42);
  });

  it('should call the handler for the matching method (uses hook2)', async () => {
    const middleware = createMethodMiddleware(getDefaultHooks());
    const engine = new JsonRpcEngine();
    engine.push(middleware);

    const response = await engine.handle({
      jsonrpc: '2.0',
      id: 1,
      method: method1,
      params: [2],
    });
    assertIsJsonRpcSuccess(response);

    expect(response.result).toBe(99);
  });

  it('should not call the handler for a non-matching method', async () => {
    const middleware = createMethodMiddleware(getDefaultHooks());
    const engine = new JsonRpcEngine();
    engine.push(middleware);

    const response = (await engine.handle({
      jsonrpc: '2.0',
      id: 1,
      method: 'nonMatchingMethod',
    })) as JsonRpcFailure;
    assertIsJsonRpcFailure(response);

    expect(response.error).toMatchObject({
      message: expect.stringMatching(
        /Response has no error or result for request/u,
      ),
    });
  });

  it('should reject unsupported methods', async () => {
    const middleware = createMethodMiddleware(getDefaultHooks());
    const engine = new JsonRpcEngine();
    engine.push(middleware);

    const response = (await engine.handle({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_signTransaction',
    })) as JsonRpcFailure;
    assertIsJsonRpcFailure(response);

    expect(response.error.message).toBe('Method not supported.');
  });

  it('should handle errors thrown by the implementation', async () => {
    const middleware = createMethodMiddleware(getDefaultHooks());
    const engine = new JsonRpcEngine();
    engine.push(middleware);

    const response = (await engine.handle({
      jsonrpc: '2.0',
      id: 1,
      method: method1,
      params: [3],
    })) as JsonRpcFailure;
    assertIsJsonRpcFailure(response);

    expect(response.error.message).toBe('test error');
  });
});
