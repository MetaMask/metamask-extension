// Request and responses are currently untyped.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { providerErrors } from '@metamask/rpc-errors';
import { JsonRpcRequest } from '@metamask/utils';
import { errorCodes } from '@metamask/rpc-errors';
import { BLOCKABLE_METHODS } from '../../../shared/constants/origin-throttling';

export type ExtendedJSONRPCRequest = JsonRpcRequest & { origin: string };

export const SPAM_FILTER_ACTIVATED_ERROR = providerErrors.unauthorized(
  'Request blocked due to spam filter.',
);

type ErrorWithCode = {
  code?: number;
} & Error;

type createOriginThrottlingMiddlewareOptions = {
  isOriginBlockedForConfirmations: (origin: string) => boolean;
  onRequestRejectedByUser: (origin: string) => void;
  onRequestAccepted: (origin: string) => boolean;
};

const isUserRejectedError = (error: ErrorWithCode) =>
  error.code === errorCodes.provider.userRejectedRequest;

export default function createOriginThrottlingMiddleware({
  isOriginBlockedForConfirmations,
  onRequestRejectedByUser,
  onRequestAccepted,
}: createOriginThrottlingMiddlewareOptions) {
  return function originThrottlingMiddleware(
    req: ExtendedJSONRPCRequest,
    res: any,
    next: any,
    end: any,
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

    next((callback: any) => {
      if (!isBlockableRPCMethod) {
        return callback();
      }

      if (!res.error) {
        onRequestAccepted(origin);
        return callback();
      }

      if (isUserRejectedError(res.error)) {
        onRequestRejectedByUser(origin);
      }

      callback();
    });
  };
}
