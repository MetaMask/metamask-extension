import { JsonRpcRequest } from '@metamask/utils';
import MultichainMiddlewareManager, {
  ExtendedJsonRpcMiddleware,
} from './MultichainMiddlewareManager';

describe('MultichainMiddlewareManager', () => {
  it('should add middleware and get called for the scope', () => {
    const multichainMiddlewareManager = new MultichainMiddlewareManager();
    const middlewareSpy = jest.fn() as unknown as ExtendedJsonRpcMiddleware;
    const domain = 'example.com';
    multichainMiddlewareManager.addMiddleware(
      'eip155:1',
      domain,
      middlewareSpy,
    );
    multichainMiddlewareManager.middleware(
      { jsonrpc: '2.0', id: 0, scope: 'eip155:1' } as unknown as JsonRpcRequest,
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
    const multichainMiddlewareManager = new MultichainMiddlewareManager();
    const middlewareMock = jest.fn() as unknown as ExtendedJsonRpcMiddleware;
    const scope = 'eip155:1';
    const domain = 'example.com';
    multichainMiddlewareManager.addMiddleware(scope, domain, middlewareMock);
    multichainMiddlewareManager.removeMiddleware(scope, domain);
    const endSpy = jest.fn();
    multichainMiddlewareManager.middleware(
      { jsonrpc: '2.0', id: 0, scope } as unknown as JsonRpcRequest,
      { jsonrpc: '2.0', id: 0 },
      () => {
        //
      },
      endSpy,
    );
    expect(endSpy).not.toHaveBeenCalled();
  });
  it('should remove all middleware', () => {
    const multichainMiddlewareManager = new MultichainMiddlewareManager();
    const middlewareMock = jest.fn() as unknown as ExtendedJsonRpcMiddleware;
    const scope = 'eip155:1';
    const scope2 = 'eip155:2';
    const domain = 'example.com';
    multichainMiddlewareManager.addMiddleware(scope, domain, middlewareMock);
    multichainMiddlewareManager.addMiddleware(scope2, domain, middlewareMock);
    multichainMiddlewareManager.removeAllMiddleware();
    const endSpy = jest.fn();
    multichainMiddlewareManager.middleware(
      { jsonrpc: '2.0', id: 0, scope } as unknown as JsonRpcRequest,
      { jsonrpc: '2.0', id: 0 },
      () => {
        //
      },
      endSpy,
    );
    expect(endSpy).not.toHaveBeenCalled();
  });
});
