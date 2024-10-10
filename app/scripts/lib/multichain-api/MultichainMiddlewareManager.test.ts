import { JsonRpcRequest } from 'json-rpc-engine';
import MultichainMiddlewareManager, {
  ExtendedJsonRpcMiddleware,
} from './MultichainMiddlewareManager';

const scope = 'eip155:1';
const origin = 'example.com';
const tabId = 123;

describe('MultichainMiddlewareManager', () => {
  it('should add middleware and get called for the scope, origin, and tabId', () => {
    const multichainMiddlewareManager = new MultichainMiddlewareManager();
    const middlewareSpy = jest.fn() as unknown as ExtendedJsonRpcMiddleware;
    multichainMiddlewareManager.addMiddleware({
      scope,
      origin,
      tabId,
      middleware: middlewareSpy,
    });

    const middleware =
      multichainMiddlewareManager.generateMultichainMiddlewareForOriginAndTabId(
        origin,
        123,
      );

    const nextSpy = jest.fn();
    const endSpy = jest.fn();

    middleware(
      { scope } as unknown as JsonRpcRequest<unknown>,
      { jsonrpc: '2.0', id: 0 },
      nextSpy,
      endSpy,
    );
    expect(middlewareSpy).toHaveBeenCalledWith(
      { scope } as unknown as JsonRpcRequest<unknown>,
      { jsonrpc: '2.0', id: 0 },
      nextSpy,
      endSpy,
    );
    expect(nextSpy).not.toHaveBeenCalled();
    expect(endSpy).not.toHaveBeenCalled();
  });

  it('should remove middleware by origin and tabId when the multiplexing middleware is destroyed', () => {
    const multichainMiddlewareManager = new MultichainMiddlewareManager();
    const middlewareSpy = jest.fn() as unknown as ExtendedJsonRpcMiddleware;
    multichainMiddlewareManager.addMiddleware({
      scope,
      origin,
      tabId,
      middleware: middlewareSpy,
    });

    const middleware =
      multichainMiddlewareManager.generateMultichainMiddlewareForOriginAndTabId(
        origin,
        123,
      );

    middleware.destroy?.();

    const nextSpy = jest.fn();
    const endSpy = jest.fn();

    middleware(
      { scope } as unknown as JsonRpcRequest<unknown>,
      { jsonrpc: '2.0', id: 0 },
      nextSpy,
      endSpy,
    );
    expect(middlewareSpy).not.toHaveBeenCalled();
    expect(nextSpy).toHaveBeenCalled();
    expect(endSpy).not.toHaveBeenCalled();
  });

  it('should remove middleware by scope', () => {
    const multichainMiddlewareManager = new MultichainMiddlewareManager();
    const middlewareSpy = jest.fn() as unknown as ExtendedJsonRpcMiddleware;
    multichainMiddlewareManager.addMiddleware({
      scope,
      origin,
      tabId,
      middleware: middlewareSpy,
    });

    multichainMiddlewareManager.removeMiddlewareByScope(scope);

    const middleware =
      multichainMiddlewareManager.generateMultichainMiddlewareForOriginAndTabId(
        origin,
        123,
      );

    const nextSpy = jest.fn();
    const endSpy = jest.fn();

    middleware(
      { scope } as unknown as JsonRpcRequest<unknown>,
      { jsonrpc: '2.0', id: 0 },
      nextSpy,
      endSpy,
    );
    expect(middlewareSpy).not.toHaveBeenCalled();
    expect(nextSpy).toHaveBeenCalled();
    expect(endSpy).not.toHaveBeenCalled();
  });

  it('should remove middleware by scope and origin', () => {
    const multichainMiddlewareManager = new MultichainMiddlewareManager();
    const middlewareSpy = jest.fn() as unknown as ExtendedJsonRpcMiddleware;
    multichainMiddlewareManager.addMiddleware({
      scope,
      origin,
      tabId,
      middleware: middlewareSpy,
    });

    multichainMiddlewareManager.removeMiddlewareByScopeAndOrigin(scope, origin);

    const middleware =
      multichainMiddlewareManager.generateMultichainMiddlewareForOriginAndTabId(
        origin,
        123,
      );

    const nextSpy = jest.fn();
    const endSpy = jest.fn();

    middleware(
      { scope } as unknown as JsonRpcRequest<unknown>,
      { jsonrpc: '2.0', id: 0 },
      nextSpy,
      endSpy,
    );
    expect(middlewareSpy).not.toHaveBeenCalled();
    expect(nextSpy).toHaveBeenCalled();
    expect(endSpy).not.toHaveBeenCalled();
  });

  it('should remove middleware by origin and tabId', () => {
    const multichainMiddlewareManager = new MultichainMiddlewareManager();
    const middlewareSpy = jest.fn() as unknown as ExtendedJsonRpcMiddleware;
    multichainMiddlewareManager.addMiddleware({
      scope,
      origin,
      tabId,
      middleware: middlewareSpy,
    });

    multichainMiddlewareManager.removeMiddlewareByOriginAndTabId(origin, tabId);

    const middleware =
      multichainMiddlewareManager.generateMultichainMiddlewareForOriginAndTabId(
        origin,
        123,
      );

    const nextSpy = jest.fn();
    const endSpy = jest.fn();

    middleware(
      { scope } as unknown as JsonRpcRequest<unknown>,
      { jsonrpc: '2.0', id: 0 },
      nextSpy,
      endSpy,
    );
    expect(middlewareSpy).not.toHaveBeenCalled();
    expect(nextSpy).toHaveBeenCalled();
    expect(endSpy).not.toHaveBeenCalled();
  });
});
