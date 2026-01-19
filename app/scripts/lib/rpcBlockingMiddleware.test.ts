import type { JsonRpcRequest } from '@metamask/utils';
import { isSnapPreinstalled } from '../../../shared/lib/snaps/snaps';
import createRpcBlockingMiddleware from './rpcBlockingMiddleware';

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
      state: { isBlocked: false },
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
      state: { isBlocked: true },
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
      state: { isBlocked: true },
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
      state: { isBlocked: true },
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
      state: { isBlocked: true },
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

  it('respects toggling isBlocked back to false', () => {
    const state = { isBlocked: true };

    const middleware = createRpcBlockingMiddleware({
      allowedOrigins: [],
      state,
    });

    state.isBlocked = false;

    const req = createRequest('https://dapp.example');
    const next = jest.fn();
    const end = jest.fn();
    middleware(req, res, next, end);

    expect(next).toHaveBeenCalledTimes(1);
    expect(end).not.toHaveBeenCalled();
  });
});
