import type {
  JsonRpcRequest,
  PendingJsonRpcResponse,
  Json,
} from '@metamask/utils';
import { MESSAGE_TYPE } from '../../../shared/constants/app';
import { createMultichainUnlockMiddleware } from './createMultichainUnlockMiddleware';

describe('createMultichainUnlockMiddleware', () => {
  const createMockRequest = (method: string): JsonRpcRequest => ({
    id: 1,
    jsonrpc: '2.0',
    method,
    params: {},
  });

  const createMockResponse = (): PendingJsonRpcResponse<Json> => ({
    id: 1,
    jsonrpc: '2.0',
  });

  // Helper to run middleware with proper async handling
  const runMiddleware = async (
    middleware: ReturnType<typeof createMultichainUnlockMiddleware>,
    request: JsonRpcRequest,
  ) => {
    const mockEnd = jest.fn();
    let nextCalled = false;

    await new Promise<void>((resolve) => {
      // The middleware from createAsyncMiddleware calls next() which should resolve
      const mockNext = jest.fn(() => {
        nextCalled = true;
        resolve();
      });

      middleware(request, createMockResponse(), mockNext, mockEnd);
    });

    return { nextCalled, mockEnd };
  };

  describe('wallet_invokeMethod', () => {
    it('waits for unlock before proceeding with wallet_invokeMethod', async () => {
      const getUnlockPromise = jest.fn().mockResolvedValue(undefined);
      const middleware = createMultichainUnlockMiddleware({ getUnlockPromise });

      const { nextCalled, mockEnd } = await runMiddleware(
        middleware,
        createMockRequest(MESSAGE_TYPE.WALLET_INVOKE_METHOD),
      );

      expect(getUnlockPromise).toHaveBeenCalledTimes(1);
      expect(getUnlockPromise).toHaveBeenCalledWith(true);
      expect(nextCalled).toBe(true);
      expect(mockEnd).not.toHaveBeenCalled();
    });

    it('shows unlock popup when wallet is locked for wallet_invokeMethod', async () => {
      let unlockResolve: () => void;
      const unlockPromise = new Promise<void>((resolve) => {
        unlockResolve = resolve;
      });
      const getUnlockPromise = jest.fn().mockReturnValue(unlockPromise);
      const middleware = createMultichainUnlockMiddleware({ getUnlockPromise });

      let nextCalled = false;
      const mockEnd = jest.fn();
      const mockNext = jest.fn(() => {
        nextCalled = true;
      });

      // Start the middleware but don't await yet
      const middlewarePromise = new Promise<void>((resolve) => {
        middleware(
          createMockRequest(MESSAGE_TYPE.WALLET_INVOKE_METHOD),
          createMockResponse(),
          () => {
            mockNext();
            resolve();
          },
          mockEnd,
        );
      });

      // Give middleware a tick to process
      await new Promise((resolve) => setImmediate(resolve));

      // Verify unlock was requested with shouldShowUnlockRequest = true
      expect(getUnlockPromise).toHaveBeenCalledWith(true);

      // Middleware should be waiting - next shouldn't be called yet
      expect(nextCalled).toBe(false);

      // Simulate user unlocking the wallet
      unlockResolve();
      await middlewarePromise;

      // Now next should have been called
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('wallet_createSession', () => {
    it('waits for unlock before proceeding with wallet_createSession', async () => {
      const getUnlockPromise = jest.fn().mockResolvedValue(undefined);
      const middleware = createMultichainUnlockMiddleware({ getUnlockPromise });

      const { nextCalled, mockEnd } = await runMiddleware(
        middleware,
        createMockRequest(MESSAGE_TYPE.WALLET_CREATE_SESSION),
      );

      expect(getUnlockPromise).toHaveBeenCalledTimes(1);
      expect(getUnlockPromise).toHaveBeenCalledWith(true);
      expect(nextCalled).toBe(true);
      expect(mockEnd).not.toHaveBeenCalled();
    });
  });

  describe('wallet_getSession', () => {
    it('does not wait for unlock for wallet_getSession (read-only)', async () => {
      const getUnlockPromise = jest.fn().mockResolvedValue(undefined);
      const middleware = createMultichainUnlockMiddleware({ getUnlockPromise });

      const { nextCalled, mockEnd } = await runMiddleware(
        middleware,
        createMockRequest(MESSAGE_TYPE.WALLET_GET_SESSION),
      );

      expect(getUnlockPromise).not.toHaveBeenCalled();
      expect(nextCalled).toBe(true);
      expect(mockEnd).not.toHaveBeenCalled();
    });
  });

  describe('wallet_revokeSession', () => {
    it('does not wait for unlock for wallet_revokeSession', async () => {
      const getUnlockPromise = jest.fn().mockResolvedValue(undefined);
      const middleware = createMultichainUnlockMiddleware({ getUnlockPromise });

      const { nextCalled, mockEnd } = await runMiddleware(
        middleware,
        createMockRequest(MESSAGE_TYPE.WALLET_REVOKE_SESSION),
      );

      expect(getUnlockPromise).not.toHaveBeenCalled();
      expect(nextCalled).toBe(true);
      expect(mockEnd).not.toHaveBeenCalled();
    });
  });

  describe('other methods', () => {
    it('does not wait for unlock for unrelated methods', async () => {
      const getUnlockPromise = jest.fn().mockResolvedValue(undefined);
      const middleware = createMultichainUnlockMiddleware({ getUnlockPromise });

      const { nextCalled, mockEnd } = await runMiddleware(
        middleware,
        createMockRequest('eth_chainId'),
      );

      expect(getUnlockPromise).not.toHaveBeenCalled();
      expect(nextCalled).toBe(true);
      expect(mockEnd).not.toHaveBeenCalled();
    });
  });
});
