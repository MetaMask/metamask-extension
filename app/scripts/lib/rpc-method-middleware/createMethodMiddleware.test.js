import { JsonRpcEngine } from '@metamask/json-rpc-engine';
import {
  assertIsJsonRpcFailure,
  assertIsJsonRpcSuccess,
} from '@metamask/utils';
import {
  createEip1193MethodMiddleware,
  createEthAccountsMethodMiddleware,
} from '.';

const getHandler = () => ({
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
        case 4:
          throw new Error('test error');
        case 5:
          // eslint-disable-next-line no-throw-literal
          throw 'foo';
        default:
          throw new Error(`unexpected param "${req.params[0]}"`);
      }
    }
    return end();
  },
  hookNames: { hook1: true, hook2: true },
  methodNames: ['method1', 'method2'],
});

jest.mock('@metamask/permission-controller', () => ({
  ...jest.requireActual('@metamask/permission-controller'),
}));

jest.mock('./handlers/wallet-getPermissions', () => ({
  getPermissionsHandler: getHandler(),
}));

jest.mock('./handlers/wallet-requestPermissions', () => ({
  requestPermissionsHandler: getHandler(),
}));

jest.mock('./handlers/wallet-revokePermissions', () => ({
  revokePermissionsHandler: getHandler(),
}));

jest.mock('./handlers', () => ({
  handlers: [getHandler()],
  eip1193OnlyHandlers: [getHandler()],
  ethAccountsHandler: getHandler(),
}));

describe.each([
  ['createEip1193MethodMiddleware', createEip1193MethodMiddleware],
  ['createEthAccountsMethodMiddleware', createEthAccountsMethodMiddleware],
])('%s', (_name, createMiddleware) => {
  const method1 = 'method1';

  const getDefaultHooks = () => ({
    hook1: () => 42,
    hook2: () => 99,
  });

  it('should return a function', () => {
    const middleware = createMiddleware(getDefaultHooks());
    expect(typeof middleware).toBe('function');
  });

  it('should throw an error if a required hook is missing', () => {
    const hooks = { hook1: () => 42 };

    // @ts-expect-error Intentional destructive testing
    expect(() => createMiddleware(hooks)).toThrow('Missing expected hooks');
  });

  it('should throw an error if an extraneous hook is provided', () => {
    const hooks = {
      ...getDefaultHooks(),
      extraneousHook: () => 100,
    };

    expect(() => createMiddleware(hooks)).toThrow('Received unexpected hooks');
  });

  it('should call the handler for the matching method (uses hook1)', async () => {
    const middleware = createMiddleware(getDefaultHooks());
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
    const middleware = createMiddleware(getDefaultHooks());
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
    const middleware = createMiddleware(getDefaultHooks());
    const engine = new JsonRpcEngine();
    engine.push(middleware);

    const response = await engine.handle({
      jsonrpc: '2.0',
      id: 1,
      method: 'nonMatchingMethod',
    });
    assertIsJsonRpcFailure(response);

    expect(response.error).toMatchObject({
      message: expect.stringMatching(
        /Response has no error or result for request/u,
      ),
    });
  });

  it('should handle errors returned by the implementation', async () => {
    const middleware = createMiddleware(getDefaultHooks());
    const engine = new JsonRpcEngine();
    engine.push(middleware);

    const response = await engine.handle({
      jsonrpc: '2.0',
      id: 1,
      method: method1,
      params: [3],
    });
    assertIsJsonRpcFailure(response);

    expect(response.error.message).toBe('test error');
    expect(response.error.data.cause.message).toBe('test error');
  });

  it('should handle errors thrown by the implementation', async () => {
    const middleware = createMiddleware(getDefaultHooks());
    const engine = new JsonRpcEngine();
    engine.push(middleware);

    const response = await engine.handle({
      jsonrpc: '2.0',
      id: 1,
      method: method1,
      params: [4],
    });
    assertIsJsonRpcFailure(response);

    expect(response.error.message).toBe('test error');
    expect(response.error.data.cause.message).toBe('test error');
  });

  it('should handle non-errors thrown by the implementation', async () => {
    const middleware = createMiddleware(getDefaultHooks());
    const engine = new JsonRpcEngine();
    engine.push(middleware);

    const response = await engine.handle({
      jsonrpc: '2.0',
      id: 1,
      method: method1,
      params: [5],
    });
    assertIsJsonRpcFailure(response);

    expect(response.error).toMatchObject({
      message: 'Internal JSON-RPC error.',
      data: 'foo',
    });
  });
});
