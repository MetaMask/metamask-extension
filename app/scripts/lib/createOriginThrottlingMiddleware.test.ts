import { errorCodes, providerErrors } from '@metamask/rpc-errors';
import { JsonRpcResponse } from '@metamask/utils';
import type { Json } from '@metamask/utils';
import createOriginThrottlingMiddleware, {
  SPAM_FILTER_ACTIVATED_ERROR,
  ExtendedJSONRPCRequest,
} from './createOriginThrottlingMiddleware';

describe('createOriginThrottlingMiddleware', () => {
  let middleware: ReturnType<typeof createOriginThrottlingMiddleware>;
  const mockGetThrottledOriginState = jest.fn();
  const mockUpdateThrottledOriginState = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    middleware = createOriginThrottlingMiddleware({
      getThrottledOriginState: mockGetThrottledOriginState,
      updateThrottledOriginState: mockUpdateThrottledOriginState,
    });
  });

  it('calls next if the method is not blockable', async () => {
    const req = {
      method: 'nonBlockableMethod',
      origin: 'testOrigin',
    } as unknown as ExtendedJSONRPCRequest;
    const next = jest.fn();
    const end = jest.fn();

    await middleware(req, {} as unknown as JsonRpcResponse<Json>, next, end);

    expect(next).toHaveBeenCalled();
    expect(end).not.toHaveBeenCalled();
  });

  it('ends with SPAM_FILTER_ACTIVATED_ERROR if the origin is blocked', async () => {
    const req = {
      method: 'eth_sendTransaction',
      origin: 'testOrigin',
    } as unknown as ExtendedJSONRPCRequest;
    const next = jest.fn();
    const end = jest.fn();

    mockGetThrottledOriginState.mockReturnValueOnce({
      rejections: 3,
      lastRejection: Date.now(),
    });

    await middleware(
      req,
      { error: null } as unknown as JsonRpcResponse<Json>,
      next,
      end,
    );

    expect(end).toHaveBeenCalledWith(SPAM_FILTER_ACTIVATED_ERROR);
    expect(next).not.toHaveBeenCalled();
  });

  it('resets throttling state if response has no error', async () => {
    const req = {
      method: 'eth_sendTransaction',
      origin: 'testOrigin',
    } as unknown as ExtendedJSONRPCRequest;
    const nextCallback = jest.fn();
    const next = jest
      .fn()
      .mockImplementation((callback) => callback(nextCallback));
    const end = jest.fn();
    const responseWithoutError = {
      error: null,
      id: 1,
      jsonrpc: '2.0',
    } as unknown as JsonRpcResponse<Json>;

    mockGetThrottledOriginState.mockReturnValue({
      rejections: 1,
      lastRejection: Date.now(),
    });

    await middleware(req, responseWithoutError, next, end);

    expect(mockUpdateThrottledOriginState).toHaveBeenCalledWith('testOrigin', {
      rejections: 0,
      lastRejection: 0,
    });
    expect(nextCallback).toHaveBeenCalled();
  });

  it('updates throttling state if response has userRejected error', async () => {
    const req = {
      method: 'eth_sendTransaction',
      origin: 'testOrigin',
    } as unknown as ExtendedJSONRPCRequest;
    const nextCallback = jest.fn();
    const next = jest
      .fn()
      .mockImplementation((callback) => callback(nextCallback));
    const end = jest.fn();
    const responseWithUserRejectedError = {
      error: {
        code: errorCodes.provider.userRejectedRequest,
      },
      id: 1,
      jsonrpc: '2.0',
    } as unknown as JsonRpcResponse<Json>;

    mockGetThrottledOriginState.mockReturnValueOnce({
      rejections: 0,
      lastRejection: 0,
    });

    await middleware(req, responseWithUserRejectedError, next, end);

    expect(mockUpdateThrottledOriginState).toHaveBeenCalledWith('testOrigin', {
      rejections: 1,
      lastRejection: expect.any(Number),
    });
    expect(nextCallback).toHaveBeenCalled();
  });

  it('does not update throttling state if response has userRejected error and rejectAllApprovals is in the error data', async () => {
    const req = {
      method: 'eth_sendTransaction',
      origin: 'testOrigin',
    } as unknown as ExtendedJSONRPCRequest;
    const nextCallback = jest.fn();
    const next = jest
      .fn()
      .mockImplementation((callback) => callback(nextCallback));
    const end = jest.fn();
    const responseWithUserRejectedError = {
      error: providerErrors.userRejectedRequest({
        data: {
          cause: 'rejectAllApprovals',
        },
      }),
      id: 1,
      jsonrpc: '2.0',
    } as unknown as JsonRpcResponse<Json>;

    mockGetThrottledOriginState.mockReturnValueOnce({
      rejections: 0,
      lastRejection: 0,
    });

    await middleware(req, responseWithUserRejectedError, next, end);

    expect(mockUpdateThrottledOriginState).not.toHaveBeenCalled();
    expect(nextCallback).toHaveBeenCalled();
  });
});
