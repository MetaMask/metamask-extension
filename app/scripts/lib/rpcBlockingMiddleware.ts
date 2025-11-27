import type { Json, JsonRpcRequest, JsonRpcResponse } from '@metamask/utils';
import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import { providerErrors } from '@metamask/rpc-errors';
import { SnapId } from '@metamask/snaps-sdk';
import { isSnapPreinstalled } from '../../../shared/lib/snaps/snaps';

export type ExtendedJsonRpcRequest = JsonRpcRequest & { origin: string };

type CreateRpcBlockingMiddlewareOptions = {
  /**
   * Error message returned when requests are blocked.
   * Defaults to 'Cannot process requests at this time'.
   */
  errorMessage?: string;
};

export default function createRpcBlockingMiddleware({
  errorMessage = 'Cannot process requests at this time',
}: CreateRpcBlockingMiddlewareOptions = {}) {
  let isBlocked = false;

  const setIsBlocked = (value: boolean) => {
    isBlocked = value;
  };

  const middleware = (
    req: ExtendedJsonRpcRequest,
    _res: JsonRpcResponse<Json>,
    next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
  ) => {
    const { origin } = req;

    if (isBlocked && !isSnapPreinstalled(origin as SnapId)) {
      end(providerErrors.unauthorized(errorMessage));
      return;
    }

    next();
  };

  return { setIsBlocked, middleware };
}
