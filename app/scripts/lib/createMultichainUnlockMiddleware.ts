import { createAsyncMiddleware } from '@metamask/json-rpc-engine';
import type {
  JsonRpcRequest,
  PendingJsonRpcResponse,
  Json,
} from '@metamask/utils';
import { MESSAGE_TYPE } from '../../../shared/constants/app';

export type GetUnlockPromise = (
  shouldShowUnlockRequest: boolean,
) => Promise<void>;

/**
 * Options for creating the multichain unlock middleware.
 */
export type CreateMultichainUnlockMiddlewareOptions = {
  /**
   * Function that returns a promise that resolves when the wallet is unlocked.
   * If shouldShowUnlockRequest is true, it will also trigger the unlock popup.
   */
  getUnlockPromise: GetUnlockPromise;
};

/**
 * Creates middleware that ensures the wallet is unlocked before processing
 * multichain API requests that require user interaction (wallet_invokeMethod
 * and wallet_createSession).
 *
 * When the wallet is locked and a dapp sends a request that requires
 * confirmation (like signing a transaction), this middleware will trigger
 * the unlock popup and wait for the user to unlock before proceeding.
 *
 * @param options - The middleware options.
 * @param options.getUnlockPromise - Function to get a promise that resolves when unlocked.
 * @returns The multichain unlock middleware.
 */
export function createMultichainUnlockMiddleware({
  getUnlockPromise,
}: CreateMultichainUnlockMiddlewareOptions) {
  return createAsyncMiddleware(
    async (
      req: JsonRpcRequest,
      _res: PendingJsonRpcResponse<Json>,
      next: () => Promise<void>,
    ) => {
      // Only require unlock for methods that may need user interaction
      const methodsRequiringUnlock: string[] = [
        MESSAGE_TYPE.WALLET_INVOKE_METHOD,
        MESSAGE_TYPE.WALLET_CREATE_SESSION,
      ];

      if (methodsRequiringUnlock.includes(req.method)) {
        // Wait for unlock, showing the unlock popup if needed
        await getUnlockPromise(true);
      }

      return next();
    },
  );
}
