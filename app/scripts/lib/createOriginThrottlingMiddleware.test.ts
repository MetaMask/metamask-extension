import { errorCodes } from '@metamask/rpc-errors';
import { JsonRpcResponse } from '@metamask/utils';
import type { Json } from '@metamask/utils';
import createOriginThrottlingMiddleware, {
  SPAM_FILTER_ACTIVATED_ERROR,
  ExtendedJSONRPCRequest,
} from './createOriginThrottlingMiddleware';

describe('createOriginThrottlingMiddleware', () => {
  let middleware: ReturnType<typeof createOriginThrottlingMiddleware>;
  const mockIsOriginBlockedForConfirmations = jest.fn();
  const mockOnRequestRejectedByUser = jest.fn();
  const mockOnRequestAccepted = jest.fn();

  beforeEach(() => {
    middleware = createOriginThrottlingMiddleware({
      isOriginBlockedForConfirmations: mockIsOriginBlockedForConfirmations,
      onRequestRejectedByUser: mockOnRequestRejectedByUser,
      onRequestAccepted: mockOnRequestAccepted,
    });
  });

  it('should call next if the method is not blockable', async () => {
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

  it('should end with SPAM_FILTER_ACTIVATED_ERROR if the origin is blocked', async () => {
    const req = {
      method: 'transaction',
      origin: 'testOrigin',
    } as unknown as ExtendedJSONRPCRequest;
    const next = jest.fn();
    const end = jest.fn();

    mockIsOriginBlockedForConfirmations.mockReturnValueOnce(true);

    await middleware(
      req,
      { error: null } as unknown as JsonRpcResponse<Json>,
      next,
      end,
    );

    expect(end).toHaveBeenCalledWith(SPAM_FILTER_ACTIVATED_ERROR);
    expect(next).not.toHaveBeenCalled();
  });

  it('should onRequestAccepted be called if response has no error', async () => {
    const req = {
      method: 'transaction',
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

    mockIsOriginBlockedForConfirmations.mockReturnValueOnce(false);

    await middleware(req, responseWithoutError, next, end);

    expect(mockOnRequestAccepted).toHaveBeenCalled();
    expect(mockOnRequestAccepted).toHaveBeenCalledWith('testOrigin');
    expect(nextCallback).toHaveBeenCalled();
  });

  it('should onRequestRejectedByUser be called if response has userRejected error', async () => {
    const req = {
      method: 'transaction',
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

    mockIsOriginBlockedForConfirmations.mockReturnValueOnce(false);

    await middleware(req, responseWithUserRejectedError, next, end);

    expect(mockOnRequestRejectedByUser).toHaveBeenCalled();
    expect(mockOnRequestRejectedByUser).toHaveBeenCalledWith('testOrigin');
    expect(nextCallback).toHaveBeenCalled();
  });
});
