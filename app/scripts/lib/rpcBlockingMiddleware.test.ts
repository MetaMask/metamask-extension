import type { Json, JsonRpcResponse } from '@metamask/utils';
import { isSnapPreinstalled } from '../../../shared/lib/snaps/snaps';
import createRpcBlockingMiddleware, {
  type ExtendedJsonRpcRequest,
} from './rpcBlockingMiddleware';

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
    ({ origin }) as unknown as ExtendedJsonRpcRequest;

  it('calls next when not blocked', async () => {
    const { middleware } = createRpcBlockingMiddleware();
    const req = createRequest();
    const next = jest.fn();
    const end = jest.fn();

    await middleware(req, {} as unknown as JsonRpcResponse<Json>, next, end);

    expect(next).toHaveBeenCalledTimes(1);
    expect(end).not.toHaveBeenCalled();
  });

  it('ends with error when blocked and origin is not a preinstalled snap', async () => {
    const customMessage = 'Requests are temporarily blocked';
    const { setIsBlocked, middleware } = createRpcBlockingMiddleware({
      errorMessage: customMessage,
    });

    setIsBlocked(true);

    const req = createRequest('https://dapp.example');
    const next = jest.fn();
    const end = jest.fn();

    await middleware(req, {} as unknown as JsonRpcResponse<Json>, next, end);

    expect(next).not.toHaveBeenCalled();
    expect(end).toHaveBeenCalledTimes(1);
    const [errorArg] = end.mock.calls[0];
    expect(errorArg).toBeInstanceOf(Error);
    expect((errorArg as Error).message).toBe(customMessage);
  });

  it('calls next when blocked but origin is a preinstalled snap', async () => {
    isSnapPreinstalledMock.mockReturnValue(true);

    const { setIsBlocked, middleware } = createRpcBlockingMiddleware();
    setIsBlocked(true);

    const req = createRequest('npm:example-snap');
    const next = jest.fn();
    const end = jest.fn();

    await middleware(req, {} as unknown as JsonRpcResponse<Json>, next, end);

    expect(next).toHaveBeenCalledTimes(1);
    expect(end).not.toHaveBeenCalled();
  });

  it('respects toggling isBlocked back to false', async () => {
    const { setIsBlocked, middleware } = createRpcBlockingMiddleware();
    setIsBlocked(true);
    setIsBlocked(false);

    const req = createRequest('https://dapp.example');
    const next = jest.fn();
    const end = jest.fn();

    await middleware(req, {} as unknown as JsonRpcResponse<Json>, next, end);

    expect(next).toHaveBeenCalledTimes(1);
    expect(end).not.toHaveBeenCalled();
  });
});
