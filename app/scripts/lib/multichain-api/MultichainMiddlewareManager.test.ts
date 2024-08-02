import { JsonRpcRequest } from '@metamask/utils';
// eslint-disable-next-line import/no-named-as-default
import createMultichainMiddlewareManager, {
  ExtendedJsonRpcMiddleware,
} from './MultichainMiddlewareManager';

describe('MultichainMiddlewareManager', () => {
  it('should add middleware and get called for the scope', () => {
    const multichainMiddlewareManager = createMultichainMiddlewareManager();
    const middlewareSpy = jest.fn() as unknown as ExtendedJsonRpcMiddleware;
    (middlewareSpy as { destroy: () => void }).destroy = jest.fn();
    const domain = 'example.com';
    multichainMiddlewareManager.addMiddleware(
      'eip155:1',
      domain,
      middlewareSpy,
    );
    multichainMiddlewareManager.middleware(
      { scope: 'eip155:1' } as unknown as JsonRpcRequest,
      { jsonrpc: '2.0', id: 0 },
      () => {
        //
      },
      () => {
        //
      },
    );
    expect(middlewareSpy).toHaveBeenCalled();
  });
  it('should remove middleware', () => {
    const multichainMiddlewareManager = createMultichainMiddlewareManager();
    const middlewareMock = jest.fn() as unknown as ExtendedJsonRpcMiddleware;
    middlewareMock.destroy = jest.fn();
    const scope = 'eip155:1';
    const domain = 'example.com';
    multichainMiddlewareManager.addMiddleware(scope, domain, middlewareMock);
    multichainMiddlewareManager.removeMiddleware(scope, domain);
    const endSpy = jest.fn();
    multichainMiddlewareManager.middleware(
      { scope } as unknown as JsonRpcRequest,
      { jsonrpc: '2.0', id: 0 },
      () => {
        //
      },
      endSpy,
    );
    expect(endSpy).not.toHaveBeenCalled();
  });
  it('should remove all middleware', () => {
    const multichainMiddlewareManager = createMultichainMiddlewareManager();
    const middlewareMock = jest.fn() as unknown as ExtendedJsonRpcMiddleware;
    middlewareMock.destroy = jest.fn();
    const scope = 'eip155:1';
    const scope2 = 'eip155:2';
    const domain = 'example.com';
    multichainMiddlewareManager.addMiddleware(scope, domain, middlewareMock);
    multichainMiddlewareManager.addMiddleware(scope2, domain, middlewareMock);
    multichainMiddlewareManager.removeAllMiddleware();
    const endSpy = jest.fn();
    multichainMiddlewareManager.middleware(
      { scope } as unknown as JsonRpcRequest,
      { jsonrpc: '2.0', id: 0 },
      () => {
        //
      },
      endSpy,
    );
    expect(endSpy).not.toHaveBeenCalled();
  });
});
