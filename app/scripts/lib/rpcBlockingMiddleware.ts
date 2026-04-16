import type { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import type { Json, JsonRpcParams } from '@metamask/utils';
import { rpcErrors } from '@metamask/rpc-errors';
import { type SnapId } from '@metamask/snaps-sdk';
import { isSnapPreinstalled } from '../../../shared/lib/snaps/snaps';

/**
 * State of the RPC blocking middleware.
 * Uses a Set of symbols: when non-empty, requests are blocked.
 * Use createRpcBlockingCallbacks to obtain onBeforeRequest/onAfterRequest for each operation.
 * The middleware stays blocked until all blocking operations complete.
 */
export type RpcBlockingMiddlewareState = {
  blockingSymbols: Set<symbol>;
};

type CreateRpcBlockingMiddlewareOptions = {
  /**
   * Error message returned when requests are blocked.
   * Defaults to 'Cannot process requests at this time'.
   */
  errorMessage?: string;
  /**
   * List of origins that are allowed to bypass the blocking middleware.
   */
  allowedOrigins: string[];
  /**
   * State of the middleware.
   * Uses a Set of symbols: when non-empty, requests are blocked.
   * Use createRpcBlockingCallbacks to obtain onBeforeRequest/onAfterRequest for each operation.
   * The middleware stays blocked until all blocking operations complete.
   */
  state: RpcBlockingMiddlewareState;
};

/**
 * Creates a pair of callbacks for a single blocking operation.
 * The callbacks must not be shared between operations.
 *
 * @param state - The RPC blocking middleware state.
 * @returns Callbacks to pass to onBeforeRequest and onAfterRequest.
 */
export function createRpcBlockingCallbacks(state: RpcBlockingMiddlewareState): {
  onBeforeRequest: () => void;
  onAfterRequest: () => void;
} {
  const symbol = Symbol('rpc-blocking');
  return {
    onBeforeRequest: () => state.blockingSymbols.add(symbol),
    onAfterRequest: () => state.blockingSymbols.delete(symbol),
  };
}

/**
 * Creates a JsonRpcMiddleware function that blocks requests to snaps when blockingSymbols is non-empty.
 *
 * @param options - The options for the middleware.
 * @param options.allowedOrigins - The list of origins that are allowed to bypass the blocking middleware.
 * @param options.errorMessage - The error message to return when requests are blocked.
 * @param options.state - The state of the middleware. Use createRpcBlockingCallbacks to obtain per-request callbacks.
 * @returns A JsonRpcMiddleware function that blocks requests to snaps when blockingSymbols is non-empty.
 */
export default function createRpcBlockingMiddleware({
  allowedOrigins,
  errorMessage = 'Cannot process requests at this time',
  state,
}: CreateRpcBlockingMiddlewareOptions): JsonRpcMiddleware<JsonRpcParams, Json> {
  return function rpcBlockingMiddleware(req, _res, next, end) {
    if (state.blockingSymbols.size === 0) {
      return next();
    }

    const { origin } = req as { origin?: string };

    if (!origin) {
      return end(
        rpcErrors.internal(
          `No origin specified for request with method ${req.method}`,
        ),
      );
    }

    const isAllowedOrigin = allowedOrigins.includes(origin);

    if (!(isAllowedOrigin || isSnapPreinstalled(origin as SnapId))) {
      return end(rpcErrors.resourceUnavailable(errorMessage));
    }

    return next();
  };
}
