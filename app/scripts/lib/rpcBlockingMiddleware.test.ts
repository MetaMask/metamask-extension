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
    const middleware = createRpcBlockingMiddleware({
      state: { isBlocked: false },
    });
    const req = createRequest();
    const next = jest.fn();
    const end = jest.fn();

    await middleware(req, {} as unknown as JsonRpcResponse<Json>, next, end);

    expect(next).toHaveBeenCalledTimes(1);
    expect(end).not.toHaveBeenCalled();
  });

  it('throws an error when blocked and origin is not a preinstalled snap', async () => {
    const customMessage = 'Requests are temporarily blocked';
    const middleware = createRpcBlockingMiddleware({
      state: { isBlocked: true },
      errorMessage: customMessage,
    });

    const req = createRequest('https://dapp.example');
    const next = jest.fn();

    await expect(
      middleware(req, {} as unknown as JsonRpcResponse<Json>, next),
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

    await middleware(req, {} as unknown as JsonRpcResponse<Json>, next);

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

    await middleware(req, {} as unknown as JsonRpcResponse<Json>, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
