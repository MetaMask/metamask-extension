import type { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import type { Json, JsonRpcParams } from '@metamask/utils';
import { rpcErrors } from '@metamask/rpc-errors';
import { InternalError, type SnapId } from '@metamask/snaps-sdk';
import { isSnapPreinstalled } from '../../../shared/lib/snaps/snaps';

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
   * Note: `isBlocked` is not concurrent safe - an operation may set `isBlocked` to `false` while a prior operation is still in progress, prematurely unblocking the middleware.
   */
  state: { isBlocked: boolean };
};

/**
 * Creates a JsonRpcMiddleware function that blocks requests to snaps when the state isBlocked is true.
 *
 * @param options - The options for the middleware.
 * @param options.allowedOrigins - The list of origins that are allowed to bypass the blocking middleware.
 * @param options.errorMessage - The error message to return when requests are blocked.
 * @param options.state - The state of the middleware. Note: `isBlocked` is not concurrent safe - an operation may set `isBlocked` to `false` while a prior operation is still in progress, prematurely unblocking the middleware.
 * @returns A JsonRpcMiddleware function that blocks requests to snaps when the state isBlocked is true.
 */
export default function createRpcBlockingMiddleware({
  allowedOrigins,
  errorMessage = 'Cannot process requests at this time',
  state,
}: CreateRpcBlockingMiddlewareOptions): JsonRpcMiddleware<JsonRpcParams, Json> {
  return function rpcBlockingMiddleware(req, _res, next, end) {
    if (!state.isBlocked) {
      return next();
    }

    const { origin } = req as { origin?: string };

    if (!origin) {
      return end(
        new InternalError(
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
