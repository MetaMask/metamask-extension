import type { Json, JsonRpcRequest, JsonRpcResponse } from '@metamask/utils';
import { isSnapPreinstalled } from '../../../shared/lib/snaps/snaps';
import createRpcBlockingMiddleware from './rpcBlockingMiddleware';
import { WalletMiddlewareContext } from '@metamask/eth-json-rpc-middleware';

jest.mock('../../../shared/lib/snaps/snaps', () => ({
  isSnapPreinstalled: jest.fn(),
}));

describe('createRpcBlockingMiddleware', () => {
  const isSnapPreinstalledMock = jest.mocked(isSnapPreinstalled);

  beforeEach(() => {
    jest.resetAllMocks();

    isSnapPreinstalledMock.mockReturnValue(false);
  });

  const createRequest = (origin = 'https://example.com') =>
    ({ origin }) as unknown as JsonRpcRequest;

  it('calls next when not blocked', () => {
    const middleware = createRpcBlockingMiddleware({
      state: { isBlocked: false },
    });
    const req = createRequest();
    const next = jest.fn();
    const context = new Map([
      ['origin', 'https://example.com'],
    ]) as WalletMiddlewareContext;

    middleware(req, {} as unknown as JsonRpcResponse<Json>, next, context);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('throws an error when blocked and origin is not a preinstalled snap', () => {
    const customMessage = 'Requests are temporarily blocked';
    const middleware = createRpcBlockingMiddleware({
      state: { isBlocked: true },
      errorMessage: customMessage,
    });

    const req = createRequest('https://dapp.example');
    const next = jest.fn();
    const context = new Map([
      ['origin', 'https://dapp.example'],
    ]) as WalletMiddlewareContext;

    expect(() =>
      middleware(req, {} as unknown as JsonRpcResponse<Json>, next, context),
    ).toThrow(customMessage);

    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when blocked but origin is a preinstalled snap', () => {
    isSnapPreinstalledMock.mockReturnValue(true);

    const middleware = createRpcBlockingMiddleware({
      state: { isBlocked: true },
    });

    const req = createRequest('npm:example-snap');
    const next = jest.fn();

    const context = new Map([
      ['origin', 'npm:example-snap'],
    ]) as WalletMiddlewareContext;

    middleware(req, {} as unknown as JsonRpcResponse<Json>, next, context);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('throws an error when blocked and origin is missing', () => {
    const middleware = createRpcBlockingMiddleware({
      state: { isBlocked: true },
    });

    const req = { method: 'eth_testMethod' } as unknown as JsonRpcRequest;
    const next = jest.fn();
    const context = new Map() as WalletMiddlewareContext;

    expect(() =>
      middleware(req, {} as unknown as JsonRpcResponse<Json>, next, context),
    ).toThrow('No origin specified for request with method eth_testMethod');

    expect(next).not.toHaveBeenCalled();
  });

  it('respects toggling isBlocked back to false', () => {
    const state = { isBlocked: true };

    const middleware = createRpcBlockingMiddleware({
      state,
    });

    state.isBlocked = false;

    const req = createRequest('https://dapp.example');
    const next = jest.fn();

    const context = new Map([
      ['origin', 'https://dapp.example'],
    ]) as WalletMiddlewareContext;

    middleware(req, {} as unknown as JsonRpcResponse<Json>, next, context);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
