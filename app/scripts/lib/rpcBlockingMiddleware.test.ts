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

  it('calls next when not blocked', async () => {
    const middleware = createRpcBlockingMiddleware({
      state: { isBlocked: false },
    });
    const req = createRequest();
    const next = jest.fn();
    const context = new Map([
      ['origin', 'https://example.com'],
    ]) as WalletMiddlewareContext;

    await middleware(
      req,
      {} as unknown as JsonRpcResponse<Json>,
      next,
      context,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('throws an error when blocked and origin is not a preinstalled snap', async () => {
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

    await expect(
      middleware(req, {} as unknown as JsonRpcResponse<Json>, next, context),
    ).rejects.toThrow(customMessage);

    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when blocked but origin is a preinstalled snap', async () => {
    isSnapPreinstalledMock.mockReturnValue(true);

    const middleware = createRpcBlockingMiddleware({
      state: { isBlocked: true },
    });

    const req = createRequest('npm:example-snap');
    const next = jest.fn();

    const context = new Map([
      ['origin', 'npm:example-snap'],
    ]) as WalletMiddlewareContext;

    await middleware(
      req,
      {} as unknown as JsonRpcResponse<Json>,
      next,
      context,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('respects toggling isBlocked back to false', async () => {
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

    await middleware(
      req,
      {} as unknown as JsonRpcResponse<Json>,
      next,
      context,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });
});
