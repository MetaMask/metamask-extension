import type { Json, JsonRpcRequest, JsonRpcResponse } from '@metamask/utils';
import type { Next } from '@metamask/json-rpc-engine/v2';
import { rpcErrors } from '@metamask/rpc-errors';
import { InternalError, SnapId } from '@metamask/snaps-sdk';
import { isSnapPreinstalled } from '../../../shared/lib/snaps/snaps';
import { WalletMiddlewareContext } from '@metamask/eth-json-rpc-middleware';

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
}: CreateRpcBlockingMiddlewareOptions) {
  const middleware = (
    req: JsonRpcRequest,
    _res: JsonRpcResponse<Json>,
    next: Next<JsonRpcRequest>,
    context: WalletMiddlewareContext,
  ) => {
    if (state.isBlocked) {
      const origin = context.get('origin');

      if (!origin) {
        throw new InternalError(
          `No origin specified for request with method ${req.method}`,
        );
      }

      if (!isSnapPreinstalled(origin as SnapId)) {
        throw rpcErrors.resourceUnavailable(errorMessage);
      }
    }

    next();
  };

  return middleware;
}
