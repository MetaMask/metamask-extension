import type { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import type { Json, JsonRpcParams } from '@metamask/utils';
import { rpcErrors } from '@metamask/rpc-errors';
import { InternalError, SnapId } from '@metamask/snaps-sdk';
import { isSnapPreinstalled } from '../../../shared/lib/snaps/snaps';

type CreateRpcBlockingMiddlewareOptions = {
  /**
   * Error message returned when requests are blocked.
   * Defaults to 'Cannot process requests at this time'.
   */
  errorMessage?: string;
  /**
   * State of the middleware.
   */
  state: { isBlocked: boolean };
};

export default function createRpcBlockingMiddleware({
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

    if (!isSnapPreinstalled(origin as SnapId)) {
      return end(rpcErrors.resourceUnavailable(errorMessage));
    }

    return next();
  };
}
