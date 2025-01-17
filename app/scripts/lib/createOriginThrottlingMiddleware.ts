import { providerErrors, errorCodes } from '@metamask/rpc-errors';
import type {
  Json,
  JsonRpcError,
  JsonRpcResponse,
  JsonRpcRequest,
} from '@metamask/utils';
import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import { BLOCKABLE_METHODS } from '../../../shared/constants/origin-throttling';

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
    const { method, origin } = req;
    const isBlockableRPCMethod = BLOCKABLE_METHODS.has(method);

    if (!isBlockableRPCMethod) {
      next();
      return;
    }

    const isDappBlocked = isOriginBlockedForConfirmations(origin);

    if (isDappBlocked) {
      end(SPAM_FILTER_ACTIVATED_ERROR);
      return;
    }

    next((callback: () => void) => {
      if (!isBlockableRPCMethod) {
        callback();
        return;
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
