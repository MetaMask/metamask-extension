import { JsonRpcRequest } from '@metamask/utils';
import MultichainMiddlewareManager from './MultichainMiddlewareManager';

describe('MultichainMiddlewareManager', () => {
  it('should add middleware and get called for the scope', () => {
    const multichainMiddlewareManager = new MultichainMiddlewareManager();
    const middlewareSpy = jest.fn();
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
    const multichainMiddlewareManager = new MultichainMiddlewareManager();
    const middlewareMock = jest.fn();
    (middlewareMock as unknown as { destroy: () => void }).destroy = jest.fn();
    const scope = 'eip155:1';
    const domain = 'example.com';
    multichainMiddlewareManager.addMiddleware(scope, domain, middlewareMock);
    multichainMiddlewareManager.removeMiddleware(scope);
    const nextSpy = jest.fn();
    multichainMiddlewareManager.middleware(
      { scope } as unknown as JsonRpcRequest,
      { jsonrpc: '2.0', id: 0 },
      nextSpy,
      () => {
        //
      },
    );
    expect(nextSpy).toHaveBeenCalled();
  });
});
