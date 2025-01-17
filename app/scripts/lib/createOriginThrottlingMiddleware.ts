import { providerErrors } from '@metamask/rpc-errors';
import { JsonRpcError, JsonRpcResponse, JsonRpcRequest } from '@metamask/utils';
import { errorCodes } from '@metamask/rpc-errors';
import { BLOCKABLE_METHODS } from '../../../shared/constants/origin-throttling';
import type { Json } from '@metamask/utils';
import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
  JsonRpcEngineReturnHandler,
} from '@metamask/json-rpc-engine';

export type ExtendedJSONRPCRequest = JsonRpcRequest & { origin: string };

export const SPAM_FILTER_ACTIVATED_ERROR = providerErrors.unauthorized(
  'Request blocked due to spam filter.',
);

type createOriginThrottlingMiddlewareOptions = {
  isOriginBlockedForConfirmations: (origin: string) => boolean;
  onRequestRejectedByUser: (origin: string) => void;
  onRequestAccepted: (origin: string) => boolean;
};

const isUserRejectedError = (error: JsonRpcError) =>
  error.code === errorCodes.provider.userRejectedRequest;

export default function createOriginThrottlingMiddleware({
  isOriginBlockedForConfirmations,
  onRequestRejectedByUser,
  onRequestAccepted,
}: createOriginThrottlingMiddlewareOptions) {
  return function originThrottlingMiddleware(
    req: ExtendedJSONRPCRequest,
    res: JsonRpcResponse<Json | JsonRpcError>,
    next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
  ) {
    const origin = req.origin;
    const isBlockableRPCMethod = BLOCKABLE_METHODS.has(req.method);

    if (!isBlockableRPCMethod) {
      return next();
    }

    const isDappBlocked = isOriginBlockedForConfirmations(origin);

    if (isDappBlocked) {
      return end(SPAM_FILTER_ACTIVATED_ERROR);
    }

    next((callback: () => void) => {
      if (!isBlockableRPCMethod) {
        return callback();
      }

      if ('error' in res && res.error && isUserRejectedError(res.error)) {
        onRequestRejectedByUser(origin);
      } else {
        onRequestAccepted(origin);
      }

      callback();
    });
  };
}
