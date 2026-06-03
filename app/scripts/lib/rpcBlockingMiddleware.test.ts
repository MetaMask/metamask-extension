import type { JsonRpcRequest } from '@metamask/utils';
import { isSnapPreinstalled } from '../../../shared/lib/snaps/snaps';
import createRpcBlockingMiddleware, {
  createRpcBlockingCallbacks,
} from './rpcBlockingMiddleware';

jest.mock('../../../shared/lib/snaps/snaps', () => ({
  isSnapPreinstalled: jest.fn(),
}));

describe('createRpcBlockingMiddleware', () => {
  const isSnapPreinstalledMock = jest.mocked(isSnapPreinstalled);
  const res = { id: 1, jsonrpc: '2.0' } as const;

  beforeEach(() => {
    jest.resetAllMocks();

    isSnapPreinstalledMock.mockReturnValue(false);
  });

  const createRequest = (origin = 'https://example.com') =>
    ({ origin }) as unknown as JsonRpcRequest;

  it('calls next when not blocked', () => {
    const middleware = createRpcBlockingMiddleware({
      allowedOrigins: [],
      state: { blockingSymbols: new Set() },
    });
    const req = createRequest();
    const next = jest.fn();
    const end = jest.fn();

    middleware(req, res, next, end);

    expect(next).toHaveBeenCalledTimes(1);
    expect(end).not.toHaveBeenCalled();
  });

  it('ends with an error when blocked and origin is not a preinstalled snap', () => {
    const customMessage = 'Requests are temporarily blocked';
    const middleware = createRpcBlockingMiddleware({
      allowedOrigins: [],
      state: { blockingSymbols: new Set([Symbol('rpc blocker')]) },
      errorMessage: customMessage,
    });

    const req = createRequest('https://dapp.example');
    const next = jest.fn();
    const end = jest.fn();

    middleware(req, res, next, end);

    expect(end).toHaveBeenCalledTimes(1);
    expect((end.mock.calls[0][0] as Error).message).toStrictEqual(
      customMessage,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when blocked but origin is a preinstalled snap', () => {
    isSnapPreinstalledMock.mockReturnValue(true);

    const middleware = createRpcBlockingMiddleware({
      allowedOrigins: [],
      state: { blockingSymbols: new Set([Symbol('rpc blocker')]) },
    });

    const req = createRequest('npm:example-snap');
    const next = jest.fn();
    const end = jest.fn();
    middleware(req, res, next, end);

    expect(next).toHaveBeenCalledTimes(1);
    expect(end).not.toHaveBeenCalled();
  });

  it('calls next when blocked but origin is in allowedOrigins', () => {
    const allowedOrigin = 'https://dapp.example';
    const middleware = createRpcBlockingMiddleware({
      allowedOrigins: [allowedOrigin],
      state: { blockingSymbols: new Set([Symbol('rpc blocker')]) },
    });

    const req = createRequest(allowedOrigin);
    const next = jest.fn();
    const end = jest.fn();

    middleware(req, res, next, end);

    expect(next).toHaveBeenCalledTimes(1);
    expect(end).not.toHaveBeenCalled();
  });

  it('ends with an error when blocked and origin is missing', () => {
    const middleware = createRpcBlockingMiddleware({
      allowedOrigins: [],
      state: { blockingSymbols: new Set([Symbol('rpc blocker')]) },
    });

    const req = { method: 'eth_testMethod' } as unknown as JsonRpcRequest;
    const next = jest.fn();
    const end = jest.fn();

    middleware(req, res, next, end);

    expect(end).toHaveBeenCalledTimes(1);
    expect((end.mock.calls[0][0] as Error).message).toStrictEqual(
      'No origin specified for request with method eth_testMethod',
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('respects blockingSymbols becoming empty', () => {
    const symbol = Symbol('rpc blocker');
    const state = { blockingSymbols: new Set([symbol]) };

    const middleware = createRpcBlockingMiddleware({
      allowedOrigins: [],
      state,
    });

    state.blockingSymbols.clear();

    const req = createRequest('https://dapp.example');
    const next = jest.fn();
    const end = jest.fn();
    middleware(req, res, next, end);

    expect(next).toHaveBeenCalledTimes(1);
    expect(end).not.toHaveBeenCalled();
  });

  it('stays blocked until all concurrent operations complete', () => {
    const state = { blockingSymbols: new Set<symbol>() };
    const middleware = createRpcBlockingMiddleware({
      allowedOrigins: [],
      state,
    });

    const blocker1 = createRpcBlockingCallbacks(state);
    const blocker2 = createRpcBlockingCallbacks(state);

    blocker1.onBeforeRequest();
    blocker2.onBeforeRequest();

    const req = createRequest('https://dapp.example');
    const next = jest.fn();
    const end = jest.fn();

    // First operation completes - set still has 1 symbol, still blocked
    blocker1.onAfterRequest();
    middleware(req, res, next, end);

    expect(end).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();

    // Second operation completes - set empty, now unblocked
    blocker2.onAfterRequest();
    const next2 = jest.fn();
    const end2 = jest.fn();
    middleware(req, res, next2, end2);

    expect(next2).toHaveBeenCalledTimes(1);
    expect(end2).not.toHaveBeenCalled();
  });

  it('duplicate onAfterRequest calls do not affect other operations', () => {
    const state = { blockingSymbols: new Set<symbol>() };
    const middleware = createRpcBlockingMiddleware({
      allowedOrigins: [],
      state,
    });

    const blocker = createRpcBlockingCallbacks(state);
    blocker.onBeforeRequest();

    // Duplicate unblock - Set.delete is idempotent for missing entries
    blocker.onAfterRequest();
    blocker.onAfterRequest();
    blocker.onAfterRequest();

    const req = createRequest('https://dapp.example');
    const next = jest.fn();
    const end = jest.fn();
    middleware(req, res, next, end);

    expect(next).toHaveBeenCalledTimes(1);
    expect(end).not.toHaveBeenCalled();
  });
});
